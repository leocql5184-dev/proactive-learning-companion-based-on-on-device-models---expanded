'use strict';
(function(root) {
  const version = 'symbolic-three-v1';
  const skills = ['joint_conditions', 'log_exponent', 'attainable_maximum'];
  function normalize(s) {
    return String(s).replace(/²/g,'^2').replace(/³/g,'^3').normalize('NFKC').replace(/\s/g,'')
      .replace(/−|–/g,'-').replace(/×/g,'*').replace(/÷/g,'/').replace(/≤/g,'<=').replace(/≥/g,'>=').replace(/≠/g,'!=');
  }
  // Bounded arithmetic AST: never execute student text. Implicit multiplication is not supported.
  function parse(raw) {
    const text = normalize(raw);
    const tokens = text.match(/\d+(?:\.\d+)?|[abxk]|[()+*/^\-]/g) || [];
    if (!text || tokens.join('') !== text || tokens.length > 80) throw Error('unsupported_expression');
    let i=0, depth=0;
    function atom() {
      if (++depth > 12) throw Error('expression_depth');
      const t=tokens[i++]; let node;
      if (t==='(') { node=add(); if(tokens[i++]!==')') throw Error('parenthesis'); }
      else if (/^[abxk]$/.test(t||'')) node={op:'var',name:t};
      else if (/^\d+(?:\.\d+)?$/.test(t||'')) { if(Number(t)>1000000) throw Error('number_range'); node={op:'num',value:Number(t)}; }
      else throw Error('atom');
      depth--; return node;
    }
    function power() { let n=atom(); if(tokens[i]==='^') { i++; const e=atom(); if(e.op!=='num'||!Number.isInteger(e.value)||e.value<0||e.value>4) throw Error('exponent'); n={op:'^',left:n,right:e}; } return n; }
    function unary() { if(tokens[i]==='-'){i++;return {op:'neg',value:unary()};}return power(); }
    function mul() { let n=unary(); while(['*','/'].includes(tokens[i])) { const op=tokens[i++]; n={op,left:n,right:unary()}; } return n; }
    function add() { let n=mul(); while(['+','-'].includes(tokens[i])) { const op=tokens[i++]; n={op,left:n,right:mul()}; } return n; }
    const ast=add(); if(i!==tokens.length) throw Error('trailing'); return ast;
  }
  function value(n, vars) {
    if(n.op==='num') return n.value;
    if(n.op==='var') { if(!Number.isFinite(vars[n.name])) throw Error('unbound'); return vars[n.name]; }
    if(n.op==='neg') return -value(n.value,vars);
    const a=value(n.left,vars), b=value(n.right,vars);
    const r=n.op==='+'?a+b:n.op==='-'?a-b:n.op==='*'?a*b:n.op==='/'?a/b:a**b;
    if(!Number.isFinite(r)||Math.abs(r)>1e12) throw Error('arithmetic_range'); return r;
  }
  function relation(raw, vars) {
    const parts=normalize(raw).split(/(<=|>=|!=|=|<|>)/);
    if(parts.length!==3) throw Error('relation');
    const left=parse(parts[0]), right=parse(parts[2]), a=value(left,vars), b=value(right,vars);
    const ok=parts[1]==='='?Math.abs(a-b)<1e-9:parts[1]==='!='?Math.abs(a-b)>=1e-9:parts[1]==='<'?a<b:parts[1]==='>'?a>b:parts[1]==='<='?a<=b:a>=b;
    return {ast:{op:parts[1],left,right},leftValue:a,rightValue:b,valid:ok};
  }
  function check(task, raw, neural={claims:[],status:'unavailable'}) {
    const text=String(raw||'').slice(0,2000), n=normalize(text), trace=[], findings=[];
    const result=(status,skillId=skills[task])=>({version,task,status,skillId,findings,trace,
      neural:{status:neural.status,modelVersion:neural.modelVersion||'unknown',validatedClaims:(neural.claims||[]).length},parameterSource:'engineering_prior'});
    if(!skills[task]) return result('UNKNOWN');
    const add=(status,skillId,reason,proof,span)=>{findings.push({status,skillId,reason,proof,span});trace.push(proof);};
    // Only a standalone assertion is treated as a mathematical claim. Questions, quoted examples
    // and negated claims remain unknown unless the learner submits an unambiguous assertion.
    const clauses=text.split(/[。；;\n]/).map(s=>s.trim()).filter(Boolean);
    const neuralQuotes=(neural.claims||[]).filter(c=>c.kind==='assertion' && typeof c.quote==='string' && clauses.includes(c.quote.trim()) && text.includes(c.quote)).map(c=>c.quote);
    const candidates=neuralQuotes.length?neuralQuotes:clauses;
    const seen=new Set();
    for(const quote of candidates) {
      if(seen.has(quote)) continue; seen.add(quote);
      if(/[?？]|是否|例如|假设|如果|不是|不应该|不能|错误|纠正|别把|有人说|“|”|「|」/.test(quote)) continue;
      let q=normalize(quote).replace(/^(?:所以|因此|我认为|答案(?:是|为)|即|得到)/,'').replace(/[.！!]$/,'')
        .replace(/的平方|的二次方/g,'^2').replace(/不等于/g,'!=').replace(/等于/g,'=').replace(/小于/g,'<').replace(/大于/g,'>');
      if(task===0) {
        // Restricted union/intersection language for the parameter range; a missing exclusion is
        // MISSING_PREMISE, not proof of a misconception.
        if(/^(?:k<1(?:且|,|并且)k!=0|k!=0(?:且|,|并且)k<1|\(-∞,0\)[∪U]\(0,1\))$/.test(q)) {
          add('VERIFIED_VALID','joint_conditions','joint_conditions', {rule:'quadratic_domain_and_discriminant',constraints:['k!=0','4-4*k>0'],solution:'k<1 and k!=0'},quote);
        } else if(q==='k<1') {
          add('MISSING_PREMISE','quadratic_definition','missing_nonzero', {rule:'missing_quadratic_degree_condition',counterexample:{k:0,degree:1}},quote);
        } else if(/^(?:k=0(?:也可以|可以|符合条件)?|k<=1(?:且|,)k!=0)$/.test(q)) {
          const k=q.startsWith('k=0')?0:1;
          add('VERIFIED_CONFLICT',k===0?'quadratic_definition':'discriminant','invalid_boundary',
            {rule:k===0?'degree_degenerates':'distinct_roots_require_positive_discriminant',witness:{k,leadingCoefficient:k,discriminant:4-4*k}},quote);
        }
      }
      if(task===1) for(const expression of q.split(/,|因为|所以/)) {
        if(!/^[x\d()+*/^=\-]+$/.test(expression)||!expression.includes('x'))continue;
        try {
          const r=relation(expression,{x:100});
          // A true numeric equality at x=100 is not necessarily an equivalent transformation.
          if(!r.valid) add('VERIFIED_CONFLICT','log_exponent','exponent_relation_conflict',{rule:'counterexample_to_equivalence',given:'lg(x)=2',witness:{x:100},...r},quote);
          else if(['10^2=x','x=10^2','x=100','100=x'].includes(expression)) add('VERIFIED_VALID','log_exponent','log_exponential_equivalence',{rule:'base10_definition',premises:['10>0','10!=1','x>0'],...r},quote);
        } catch(_) {}
      }
      if(task===2) {
        const assignment=q.match(/^a=(\d+),b=(\d+)(?:时|,)(?:最大值(?:是|为|=)?|值(?:是|为|=)?|f=)(\d+)$/);
        if(assignment) {
          const a=Number(assignment[1]),b=Number(assignment[2]),claimed=Number(assignment[3]);
          if(a<0||a>2||b<0||b>2) add('VERIFIED_CONFLICT','attainable_maximum','outside_domain',{rule:'domain_check',witness:{a,b},domain:'[0,2]^2'},quote);
          else {
            const actual=value(parse('a^2-a'),{a})+Math.abs(b-a);
            if(actual!==claimed) add('VERIFIED_CONFLICT','attainable_maximum','incompatible_extrema',{rule:'evaluate_feasible_pair',witness:{a,b},claimed,actual},quote);
            else add('MISSING_PREMISE','attainable_maximum','needs_upper_bound',{rule:'feasible_value_does_not_prove_upper_bound',witness:{a,b},actual},quote);
          }
        }
        if(/^(?:最大值(?:为|是|=))\d+$/.test(q) && Number(q.match(/\d+$/)[0])!==4)
          add('VERIFIED_CONFLICT','attainable_maximum','maximum_claim_conflict',{rule:'piecewise_convex_endpoint_bound',branches:['a^2','a^2-2*a+2'],endpointValues:[[0,4],[2,2]],maximum:4,attained:{a:2,b:0}},quote);
        if(q==='4'||q==='最大值为4'||q==='最大值是4') add('MISSING_PREMISE','attainable_maximum','needs_upper_bound',{rule:'answer_without_bound'},quote);
        // An explicit complete derivation can establish the bound; paraphrases need further checking.
        if(q==='固定a,b取0或2,比较a^2和a^2-2*a+2,上界为4,a=2,b=0取到')
          add('VERIFIED_VALID','attainable_maximum','verified_bound',{rule:'convex_in_b_then_convex_in_a',branches:['a^2','a^2-2*a+2'],endpointValues:[[0,4],[2,2]],maximum:4,attained:{a:2,b:0}},quote);
      }
    }
    const conflict=findings.find(f=>f.status==='VERIFIED_CONFLICT');
    if(conflict) return result('VERIFIED_CONFLICT',conflict.skillId);
    const valid=findings.find(f=>f.status==='VERIFIED_VALID');
    if(valid) return result('VERIFIED_VALID',valid.skillId);
    const missing=findings.find(f=>f.status==='MISSING_PREMISE');
    if(missing) return result('MISSING_PREMISE',missing.skillId);
    return result('UNKNOWN');
  }
  const api={version,parse,value,relation,check};
  if(typeof module!=='undefined'&&module.exports) module.exports=api; else root.SymbolicReasoner=api;
})(typeof globalThis!=='undefined'?globalThis:this);
