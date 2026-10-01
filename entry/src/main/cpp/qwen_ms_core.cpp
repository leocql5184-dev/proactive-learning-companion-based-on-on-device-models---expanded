#include "qwen_ms_core.h"
#ifdef QWEN_MS_WINDOWS_TEST
#include "ms_windows_test_api.h"
#else
#include "mindspore/model.h"
#endif
#include <algorithm>
#include <cmath>
#include <cstring>
#include <stdexcept>

namespace {
constexpr int CONTEXT = 2048;
constexpr int VOCAB = 151936;
class Model {
public:
    OH_AI_ModelHandle handle = nullptr;
    OH_AI_ContextHandle context = nullptr;
    OH_AI_TensorHandleArray inputs{};
    explicit Model(const std::string &path) {
        try {
            context = OH_AI_ContextCreate();
            if (!context) throw std::runtime_error("CONTEXT_CREATE_FAILED");
            OH_AI_ContextSetThreadNum(context, 4);
            OH_AI_ContextSetThreadAffinityMode(context, 0);
            auto cpu = OH_AI_DeviceInfoCreate(OH_AI_DEVICETYPE_CPU);
            if (!cpu) throw std::runtime_error("CPU_CREATE_FAILED");
            OH_AI_DeviceInfoSetEnableFP16(cpu, false);
            OH_AI_ContextAddDeviceInfo(context, cpu);
            handle = OH_AI_ModelCreate();
            if (!handle) throw std::runtime_error("MODEL_CREATE_FAILED");
            auto status = OH_AI_ModelBuildFromFile(handle, path.c_str(), OH_AI_MODELTYPE_MINDIR, context);
            if (status != OH_AI_STATUS_SUCCESS) throw std::runtime_error("MS_MODEL_BUILD_FAILED:" + std::to_string(status));
            inputs = OH_AI_ModelGetInputs(handle);
            if (!inputs.handle_list) throw std::runtime_error("MS_INPUTS_MISSING");
        } catch (...) { Close(); throw; }
    }
    Model(const Model &) = delete;
    Model &operator=(const Model &) = delete;
    ~Model() { Close(); }
    void Close() {
        if (handle) OH_AI_ModelDestroy(&handle);
        if (context) OH_AI_ContextDestroy(&context);
    }
    template<typename T> T *Data(OH_AI_TensorHandle tensor, size_t count) {
        if (!tensor || OH_AI_TensorGetDataSize(tensor) != count * sizeof(T))
            throw std::runtime_error("MS_TENSOR_CONTRACT_MISMATCH");
        auto data = static_cast<T *>(OH_AI_TensorGetMutableData(tensor));
        if (!data) throw std::runtime_error("MS_TENSOR_ALLOCATION_FAILED");
        return data;
    }
    OH_AI_TensorHandleArray Predict(const std::function<void()> &check) {
        check(); OH_AI_TensorHandleArray outputs{};
        auto status = OH_AI_ModelPredict(handle, inputs, &outputs, nullptr, nullptr);
        check();
        if (status != OH_AI_STATUS_SUCCESS) throw std::runtime_error("MS_PREDICT_FAILED:" + std::to_string(status));
        if (!outputs.handle_list || outputs.handle_num != 57) throw std::runtime_error("MS_OUTPUT_CONTRACT_MISMATCH");
        return outputs;
    }
};
OH_AI_TensorHandle Find(OH_AI_TensorHandleArray array, const std::string &name) {
    for (size_t i = 0; i < array.handle_num; i++) {
        const char *actual = OH_AI_TensorGetName(array.handle_list[i]);
        if (actual && name == actual) return array.handle_list[i];
    }
    throw std::runtime_error("MS_TENSOR_MISSING:" + name);
}
void Rope(float *data, int length, int start, bool sine) {
    for (int row = 0; row < length; row++) for (int col = 0; col < 128; col++) {
        float frequency = 1.0f / std::pow(1000000.0f, static_cast<float>(2 * (col % 64)) / 128.0f);
        float angle = static_cast<float>(start + row) * frequency;
        data[row * 128 + col] = sine ? std::sin(angle) : std::cos(angle);
    }
}
void Prefill(Model &model, const std::vector<int32_t> &ids) {
    if (model.inputs.handle_num != 5) throw std::runtime_error("MS_PREFILL_CONTRACT_MISMATCH");
    auto tokens = model.Data<int32_t>(Find(model.inputs, "input_ids"), CONTEXT);
    std::fill(tokens, tokens + CONTEXT, 0); std::copy(ids.begin(), ids.end(), tokens);
    model.Data<int32_t>(Find(model.inputs, "last_position"), 1)[0] = static_cast<int32_t>(ids.size() - 1);
    Rope(model.Data<float>(Find(model.inputs, "rope_cos"), CONTEXT * 128), CONTEXT, 0, false);
    Rope(model.Data<float>(Find(model.inputs, "rope_sin"), CONTEXT * 128), CONTEXT, 0, true);
    auto mask = model.Data<float>(Find(model.inputs, "attention_mask"), CONTEXT * CONTEXT);
    for (int row = 0; row < CONTEXT; row++) for (int col = 0; col < CONTEXT; col++)
        mask[row * CONTEXT + col] = col > row ? -10000.0f : 0.0f;
}
void Decode(Model &model, OH_AI_TensorHandleArray previous, int32_t token, int position) {
    if (model.inputs.handle_num != 63) throw std::runtime_error("MS_DECODE_CONTRACT_MISMATCH");
    for (size_t i = 0; i < model.inputs.handle_num; i++) {
        auto tensor = model.inputs.handle_list[i];
        const char *rawName = OH_AI_TensorGetName(tensor);
        if (!rawName) throw std::runtime_error("MS_INPUT_NAME_MISSING");
        std::string name(rawName);
        if (name == "input_ids") model.Data<int32_t>(tensor, 1)[0] = token;
        else if (name == "last_position") model.Data<int32_t>(tensor, 1)[0] = 0;
        else if (name == "rope_cos" || name == "rope_sin") Rope(model.Data<float>(tensor, 128), 1, position, name == "rope_sin");
        else if (name == "attention_mask" || name == "cache_keep" || name == "cache_write") {
            auto data = model.Data<float>(tensor, CONTEXT);
            for (int col = 0; col < CONTEXT; col++) data[col] = name == "attention_mask" ? (col > position ? -10000.0f : 0.0f) :
                name == "cache_write" ? (col == position ? 1.0f : 0.0f) : (col == position ? 0.0f : 1.0f);
        } else if (name.rfind("past_", 0) == 0) {
            auto source = Find(previous, "present_" + name.substr(5));
            auto destination = model.Data<float>(tensor, 8 * CONTEXT * 128);
            if (OH_AI_TensorGetDataSize(source) != OH_AI_TensorGetDataSize(tensor)) throw std::runtime_error("MS_KV_SHAPE_MISMATCH");
            const void *data = OH_AI_TensorGetData(source);
            if (!data) throw std::runtime_error("MS_KV_DATA_MISSING");
            // Copy all cache inputs before Predict can replace output storage.
            std::memmove(destination, data, OH_AI_TensorGetDataSize(tensor));
        } else throw std::runtime_error("MS_UNKNOWN_INPUT:" + name);
    }
}
int32_t Argmax(OH_AI_TensorHandleArray outputs) {
    auto tensor = Find(outputs, "logits");
    if (OH_AI_TensorGetDataSize(tensor) != VOCAB * sizeof(float)) throw std::runtime_error("MS_LOGITS_SHAPE_MISMATCH");
    auto data = static_cast<const float *>(OH_AI_TensorGetData(tensor));
    if (!data) throw std::runtime_error("MS_LOGITS_MISSING");
    int32_t best = 0;
    for (int32_t i = 0; i < VOCAB; i++) {
        if (!std::isfinite(data[i])) throw std::runtime_error("MS_NONFINITE_LOGITS");
        if (data[i] > data[best]) best = i;
    }
    return best;
}
}
std::vector<int32_t> GenerateQwenMs(const std::string &directory,
    const std::vector<int32_t> &ids, int budget, const std::function<void()> &check,
    const std::function<void(const std::vector<int32_t> &)> &progress) {
    if (ids.empty() || budget < 1 || budget > 160 || ids.size() + budget > CONTEXT) throw std::runtime_error("CONTEXT_TOO_LONG");
    for (auto id : ids) if (id < 0 || id >= VOCAB) throw std::runtime_error("INVALID_TOKEN_ID");
    check(); Model prefill(directory + "/qwen-prefill.ms");
    check(); Model decode(directory + "/qwen-decode.ms");
    check(); Prefill(prefill, ids);
    auto outputs = prefill.Predict(check);
    std::vector<int32_t> generated;
    for (int step = 0; step < budget; step++) {
        check(); auto token = Argmax(outputs);
        if (token == 151643 || token == 151645) break;
        generated.push_back(token); progress(generated);
        if (step + 1 < budget) {
            Decode(decode, outputs, token, static_cast<int>(ids.size()) + step);
            outputs = decode.Predict(check);
        }
    }
    check();
    if (generated.empty()) throw std::runtime_error("EMPTY_RESPONSE");
    return generated;
}
