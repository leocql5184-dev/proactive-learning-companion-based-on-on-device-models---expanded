#include "napi/native_api.h"
#include "qwen_ms_core.h"
#include <algorithm>
#include <atomic>
#include <chrono>
#include <memory>
#include <mutex>
#include <stdexcept>
#include <string>
#include <vector>

namespace {
std::atomic<bool> busy{false}, cancelled{false};
std::mutex outputMutex;
std::vector<int32_t> output;

struct Job {
    napi_async_work work = nullptr;
    napi_deferred deferred = nullptr;
    std::string path, error;
    std::vector<int32_t> prompt, result;
    std::chrono::steady_clock::time_point deadline;
};
bool Abort(void *data) {
    return cancelled.load() || std::chrono::steady_clock::now() > static_cast<Job *>(data)->deadline;
}
std::string StringArg(napi_env env, napi_value value) {
    size_t length = 0;
    if (napi_get_value_string_utf8(env, value, nullptr, 0, &length) != napi_ok || length > 32768)
        throw std::runtime_error("INVALID_INPUT");
    std::vector<char> buffer(length + 1);
    napi_get_value_string_utf8(env, value, buffer.data(), buffer.size(), &length);
    return std::string(buffer.data(), length);
}
napi_value Tokens(napi_env env, const std::vector<int32_t> &ids) {
    napi_value buffer, value; void *data = nullptr;
    napi_create_arraybuffer(env, ids.size() * sizeof(int32_t), &data, &buffer);
    if (!ids.empty()) std::copy(ids.begin(), ids.end(), static_cast<int32_t *>(data));
    napi_create_typedarray(env, napi_int32_array, ids.size(), buffer, 0, &value);
    return value;
}
void Execute(napi_env, void *data) {
    auto &job = *static_cast<Job *>(data);
    try {
        job.deadline = std::chrono::steady_clock::now() + std::chrono::seconds(120);
        job.result = GenerateQwenMs(job.path, job.prompt, 160,
            [&job] { if (Abort(&job)) throw std::runtime_error("CANCELLED_OR_TIMEOUT"); },
            [](const std::vector<int32_t> &ids) { std::lock_guard<std::mutex> lock(outputMutex); output = ids; });
    } catch (const std::exception &error) { job.error = error.what(); }
      catch (...) { job.error = "INFERENCE_FAILED"; }
}
void Complete(napi_env env, napi_status status, void *data) {
    std::unique_ptr<Job> job(static_cast<Job *>(data));
    if (status != napi_ok && job->error.empty()) job->error = "INFERENCE_FAILED";
    napi_value text, error;
    if (job->error.empty()) {
        text = Tokens(env, job->result);
        napi_resolve_deferred(env, job->deferred, text);
    } else {
        napi_create_string_utf8(env, job->error.c_str(), NAPI_AUTO_LENGTH, &text);
        napi_create_error(env, nullptr, text, &error);
        napi_reject_deferred(env, job->deferred, error);
    }
    napi_delete_async_work(env, job->work);
    { std::lock_guard<std::mutex> lock(outputMutex); output.clear(); }
    busy.store(false);
}
napi_value Generate(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value args[2], promise, resource;
    napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
    auto job = std::make_unique<Job>();
    try {
        if (argc != 2) throw std::runtime_error("INVALID_INPUT");
        job->path = StringArg(env, args[0]);
        napi_typedarray_type type; size_t length, offset; void *data = nullptr; napi_value buffer;
        if (napi_get_typedarray_info(env, args[1], &type, &length, &data, &buffer, &offset) != napi_ok ||
            type != napi_int32_array || length == 0 || length > 1888 || !data) throw std::runtime_error("INVALID_INPUT");
        auto ids = static_cast<int32_t *>(data); job->prompt.assign(ids, ids + length);
    } catch (...) { napi_throw_error(env, nullptr, "INVALID_INPUT"); return nullptr; }
    bool expected = false;
    if (!busy.compare_exchange_strong(expected, true)) {
        napi_throw_error(env, nullptr, "MODEL_BUSY"); return nullptr;
    }
    cancelled.store(false);
    { std::lock_guard<std::mutex> lock(outputMutex); output.clear(); }
    napi_create_promise(env, &job->deferred, &promise);
    napi_create_string_utf8(env, "offlineQwen", NAPI_AUTO_LENGTH, &resource);
    if (napi_create_async_work(env, nullptr, resource, Execute, Complete, job.get(), &job->work) != napi_ok ||
        napi_queue_async_work(env, job->work) != napi_ok) {
        if (job->work) napi_delete_async_work(env, job->work);
        busy.store(false);
        napi_value message, error;
        napi_create_string_utf8(env, "WORKER_FAILED", NAPI_AUTO_LENGTH, &message);
        napi_create_error(env, nullptr, message, &error);
        napi_reject_deferred(env, job->deferred, error);
        return promise;
    }
    (void) job.release();
    return promise;
}
napi_value Progress(napi_env env, napi_callback_info) {
    std::lock_guard<std::mutex> lock(outputMutex);
    napi_value value;
    value = Tokens(env, output);
    return value;
}
napi_value Cancel(napi_env env, napi_callback_info) {
    cancelled.store(true);
    napi_value value; napi_get_undefined(env, &value); return value;
}
napi_value Init(napi_env env, napi_value exports) {
    napi_property_descriptor properties[] = {
        {"generate", nullptr, Generate, nullptr, nullptr, nullptr, napi_default, nullptr},
        {"progress", nullptr, Progress, nullptr, nullptr, nullptr, napi_default, nullptr},
        {"cancel", nullptr, Cancel, nullptr, nullptr, nullptr, napi_default, nullptr}
    };
    napi_define_properties(env, exports, 3, properties);
    return exports;
}
}
static napi_module module = {1, 0, nullptr, Init, "companion_llm", nullptr, {0}};
extern "C" __attribute__((constructor)) void RegisterCompanionLlm() { napi_module_register(&module); }
