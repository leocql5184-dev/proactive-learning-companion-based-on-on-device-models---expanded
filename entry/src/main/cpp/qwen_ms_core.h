#pragma once
#include <cstdint>
#include <functional>
#include <string>
#include <vector>
std::vector<int32_t> GenerateQwenMs(const std::string &directory,
    const std::vector<int32_t> &input, int budget,
    const std::function<void()> &check,
    const std::function<void(const std::vector<int32_t> &)> &progress);
