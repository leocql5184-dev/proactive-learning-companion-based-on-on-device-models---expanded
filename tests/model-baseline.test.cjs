const {test}=require('node:test');
const assert=require('node:assert/strict');
const baseline=require('../tools/local-llm/desktop/baseline.cjs');
test('second exercise refuses direct answers without giving the result or option',()=>{
  const input={stage:'refuse',task:1,question:'你能直接告诉我答案吗？'};
  assert.equal(baseline.check(input),true);
  assert.match(baseline.prompt(input),/lg x = 2/);
  assert.doesNotMatch(baseline.prompt(input),/kx²/);
  assert.equal(baseline.valid('我先不直接告诉你答案，好吗？我们可以一起找找思路。','refuse'),true);
  for(const content of ['答案是100。','我不能直接告诉你答案，但你可以选B，我们一起想。','我不告诉你答案是一百，我们一起想。'])
    assert.equal(baseline.valid(content,'refuse'),false);
});
test('stage prompts include the real exercise and demonstration, and validate rather than replace model text',()=>{
  for(const stage of ['start','waiting','hint','complete']) {
    const prompt=baseline.prompt({stage,question:'学生输入'});
    assert.match(prompt,/kx²−2x\+1=0/);
    assert.match(prompt,/本轮唯一任务/);
  }
  assert.equal(baseline.valid('函数要求每个输入都有唯一输出。','start'),false);
  assert.equal(baseline.valid('对数是指数的逆运算。','waiting'),false);
  assert.equal(baseline.valid('是的，但还要考虑k=0。','waiting'),false);
  assert.equal(baseline.valid('是的，没错，但是是不是还少考虑了什么呢？','waiting'),true);
  assert.equal(baseline.valid('应该停一停，考虑一下k等于0。','hint'),true);
  assert.equal(baseline.valid('对了，为什么这样做？','complete'),false);
  assert.equal(baseline.check({stage:'complete',question:'k<1'}),false);
  assert.equal(baseline.check({stage:'complete',question:'答案应该是k<1且k不为0'}),true);
});
test('opening rejects worked calculations and parameter answers in both directions',()=>{
  for(const reply of [
    '两个不相等的实根可以通过判别式来考虑，即判别式D=4k-4>0，所以k>1。',
    '用判别式D=4-4k>0，所以k<1。',
    '判别式大于零，所以参数小于一。',
    '通过判别式可知1>k。',
    '判别式Ｄ＝４−４ｋ＞０。',
    '判别式为正数。'
  ]) assert.equal(baseline.valid(reply,'start'),false,reply);
  assert.equal(baseline.valid('两个不相等的实根，可以通过判别式来考虑。你准备怎样列条件？','start'),true);
});
