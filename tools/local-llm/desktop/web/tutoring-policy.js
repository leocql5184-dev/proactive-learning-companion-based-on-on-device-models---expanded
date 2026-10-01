(function (root) {
  'use strict';
  // Only reviewed questions may leave this boundary; never interpolate learner/model text.
  const hints = Object.freeze({
    clarify: '我们先找一个可以自己完成的小步骤：你目前知道哪些条件，又卡在哪个概念或推理上？',
    explain: '先不补充新的结果。你能用自己的话说明这一步的依据，并想想怎样检验它吗？',
    rest: '可以先放松一下，不急着继续。你想暂停片刻，还是先说说最让你费力的地方？',
    log_concept: '先把计算放一放，回忆对数与指数的对应关系：题目里的各个量分别扮演什么角色？',
    log_rewrite: '试着把对数关系改写成指数关系，先不计算：你准备把已知条件分别放在什么位置？',
    log_check: '把自己的结果代回题目检验：它是否满足原来的对数关系，你会怎样说明？',
    quadratic_type: '先检查题目中的“一元二次方程”这个条件：它对二次项系数有什么要求？',
    quadratic_roots: '接下来关注根的个数：判别式的符号怎样区分重根和不同的实根，你准备怎样检查？',
    quadratic_combine: '回看方程类型和根的个数这两个条件：你的结论是否同时满足它们，有没有遗漏边界？',
    interval_distance: '先固定其中一个变量，观察绝对值部分：另一个变量往区间的哪一端移动时，两者的距离可能更远？',
    interval_cases: '沿着端点的想法继续：分别讨论端点后，你打算怎样比较剩余表达式在区间内的变化？',
    interval_check: '回看你考虑过的情形：区间端点和内部可能的极值位置是否都检查过，你会怎样比较？'
  });
  const version = 'tutoring-guardrails-v1';
  function candidates(input = {}) {
    const context = String(input.question || '') + ' ' + String(input.draft || '');
    const stem = String(input.stem || '');
    if (/累|烦躁|休息/.test(context)) return ['rest'];
    if (input.assessment === 'correct') return ['explain'];
    if (/lg|对数/.test(stem)) {
      if (/代回|检验/.test(context)) return ['log_check'];
      if (/底数|指数|真数/.test(context)) return ['log_rewrite', 'log_check'];
      return ['log_concept', 'log_rewrite'];
    }
    if (/kx|实根/.test(stem)) {
      if (/判别式/.test(context) && /系数|二次项|交集/.test(context)) return ['quadratic_combine'];
      if (/判别式|二次项|系数/.test(context)) return ['quadratic_roots', 'quadratic_combine'];
      return ['quadratic_type'];
    }
    if (/最值|绝对值|\|b/.test(stem)) {
      if (/极值|内部|比较/.test(context)) return ['interval_check'];
      if (/端点|边界/.test(context)) return ['interval_cases', 'interval_check'];
      return ['interval_distance'];
    }
    return ['clarify', 'explain'];
  }
  function select(input, modelOutput = '') {
    const allowed = candidates(input), id = String(modelOutput).trim();
    const accepted = allowed.includes(id), strategy = accepted ? id : allowed[0];
    return { content: hints[strategy], strategy, policyVersion: version,
      source: accepted ? 'model-selected-guidance' : 'guided-fallback' };
  }
  const policy = Object.freeze({ hints, version, candidates, select });
  if (typeof module !== 'undefined' && module.exports) module.exports = policy;
  else root.TutoringPolicy = policy;
})(typeof globalThis !== 'undefined' ? globalThis : this);
