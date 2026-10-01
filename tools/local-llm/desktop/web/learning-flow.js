(function (root) {
  'use strict';
  const policy = typeof module !== 'undefined' && module.exports ? require('./tutoring-policy.js') : root.TutoringPolicy;
// BEGIN CATALOG LESSONS
  const catalogLessons = [
  {
    "id": "FUNC-FB-0051",
    "chapter": "零点与方程",
    "title": "函数的零点与方程根的关系",
    "type": "FB",
    "stem": "已知一次函数f(x) = ax - 1的零点是x = 2，则a的值为_____（填最简分数）",
    "options": [],
    "answer": "`1/2`",
    "core": -1,
    "guide": "零点处函数值为零。把给定的横坐标代入解析式，你能列出关于系数的方程吗？"
  },
  {
    "id": "FUNC-FB-0068",
    "chapter": "函数性质与变化",
    "title": "函数的周期性",
    "type": "FB",
    "stem": "若函数f(x)满足f(x + 1) = -f(x)对任意x ∈R成立，则f(x)的一个周期是_____。",
    "options": [],
    "answer": "2",
    "core": -1,
    "guide": "把关系式中的自变量再向右平移一次。两次符号变化后，函数值与原来有什么关系？"
  },
  {
    "id": "FUNC-FB-0073",
    "chapter": "函数性质与变化",
    "title": "减函数",
    "type": "FB",
    "stem": "若函数f(x) = mx + 1在R上是减函数，则实数m的取值范围是_____",
    "options": [],
    "answer": "`m<0`",
    "core": -1,
    "guide": "一次函数的增减由斜率决定。自变量增大时，怎样的系数会让函数值减小？"
  },
  {
    "id": "FUNC-FB-0091",
    "chapter": "函数最值与应用",
    "title": "函数的最小值",
    "type": "FB",
    "stem": "函数f(x) = -3x + 1，x ∈[0,4]的最小值是_____。",
    "options": [],
    "answer": "-11",
    "core": -1,
    "guide": "先看斜率判断增减，再比较给定区间的两端。最小值应该在哪一端取到？"
  },
  {
    "id": "FUNC-FB-0092",
    "chapter": "函数最值与应用",
    "title": "函数的最小值",
    "type": "FB",
    "stem": "函数f(x) = x^{2} -4x + 5的最小值是_____。",
    "options": [],
    "answer": "1",
    "core": -1,
    "guide": "试着配方，把含自变量的部分写成一个平方。平方的取值有什么下界？"
  },
  {
    "id": "FUNC-FB-0093",
    "chapter": "函数最值与应用",
    "title": "函数的最小值",
    "type": "FB",
    "stem": "函数f(x) = 7，x ∈R的最小值是_____。",
    "options": [],
    "answer": "7",
    "core": -1,
    "guide": "这个函数的值会随自变量改变吗？先区分函数值和取得该值的位置。"
  },
  {
    "id": "FUNC-FB-0096",
    "chapter": "函数最值与应用",
    "title": "函数的最小值点",
    "type": "FB",
    "stem": "小明跑步时消耗的能量与时间t（单位：分钟）的函数关系为f(t) = t^{2} -6t + 10 （t ≥0），则小明消耗能量最少时的时间t值为_____。",
    "options": [],
    "answer": "3",
    "core": -1,
    "guide": "先配方找出抛物线的顶点，再检查对应时间是否满足非负条件。题目问的是时间还是能量？"
  },
  {
    "id": "FUNC-SA-0026",
    "chapter": "零点与方程",
    "title": "结合函数图像判断一元二次方程实根的存在性及实根的个数",
    "type": "SA",
    "stem": "已知函数f(x) = x^{2} -2mx + m^{2} -1，其中m为实数。 1、 试判断方程f(x) = 0的实根个数； 2、 若方程f(x) = 0的两个实根均大于-2且小于4，求实数m的取值范围。",
    "options": [],
    "answer": "（1）2 个不等实根；（2）`-1<m<3`",
    "core": -1,
    "guide": "把二次式配成平方，先判断零点个数；再分别给两个根写出题目要求的不等式。"
  },
  {
    "id": "FUNC-SA-0112",
    "chapter": "指数与幂的运算",
    "title": "解析法",
    "type": "SA",
    "stem": "正数a,b满足2^{a} - 4^{b} = \\log_{2}b - \\log_{2}a, 则a与2b大小关系为",
    "options": [],
    "answer": "`a<2b`",
    "core": -1,
    "guide": "把指数项移到一边，对数项移到另一边。假设两变量按题目比较的方向排列，两边的符号能一致吗？"
  },
  {
    "id": "FUNC-SA-0147",
    "chapter": "指数与幂的运算",
    "title": "指数函数的性质",
    "type": "SA",
    "stem": "若函数y = (k + 2)a^{x} +2 - b(a > 0，且a ≠1)是指数函数，则k = ( )，b = ( ).",
    "options": [],
    "answer": "`k=-1，b=2`",
    "core": -1,
    "guide": "指数函数的标准形式是底数的自变量次幂。比较乘在指数项前的系数和后面的常数项。"
  },
  {
    "id": "FUNC-SA-0171",
    "chapter": "对数与指数互化",
    "title": "自然对数",
    "type": "SA",
    "stem": "解方程：\\ln (x + 1) - \\ln (x) = \\ln (3)",
    "options": [],
    "answer": "`x=1/2`",
    "core": -1,
    "guide": "先列出两个真数都为正的条件，再利用对数相减对应真数相除，把等式改写成指数关系。"
  },
  {
    "id": "FUNC-SA-0193",
    "chapter": "函数性质与变化",
    "title": "奇函数",
    "type": "SA",
    "stem": "函数y = f(x + 1) + 2是定义域为R的奇函数, 则f(e) +f(2 - e) =.",
    "options": [],
    "answer": "-4",
    "core": -1,
    "guide": "把题目给出的整体设为一个新函数。奇函数在互为相反数的两个输入处，函数值有什么关系？"
  },
  {
    "id": "FUNC-SA-0202",
    "chapter": "函数性质与变化",
    "title": "偶函数",
    "type": "SA",
    "stem": "已知函数f(x)满足f(x) = f(2 - x), 且f(x)是偶函数, 在[0,1]上有f(x) = 2^{x} -1, 则 f(5) =.",
    "options": [],
    "answer": "1",
    "core": -1,
    "guide": "把偶函数关系与关于给定位置的对称关系结合，尝试把待求输入移到已知区间。"
  },
  {
    "id": "FUNC-SA-0215",
    "chapter": "函数基础与表示",
    "title": "函数的形成与发展",
    "type": "SA",
    "stem": "《九章算术》是中国古代重要的数学著作，其中记载了这样一个问题：’今 有粟一斗，欲为粝米，问得几何？’已知粟米的出米率是 \\frac{3}{5}。若设粟的数量为x 斗，出米数量为y斗，请解答下列问题： 1、 建立y与x之间的函数关系； 2、 计算当x = 5斗时的出米量。",
    "options": [],
    "answer": "`y=3x/5（x≥0）`；当 `x=5` 时 `y=3`",
    "core": -1,
    "guide": "出米率表示每斗粟能得到多少斗米。先写总量与比例的关系，再代入指定数量。"
  },
  {
    "id": "FUNC-SA-0252",
    "chapter": "对数与指数互化",
    "title": "对数函数的性质",
    "type": "SA",
    "stem": "函数y = \\log_{2}(5 + 4x - x^{2})的值域为，单调递增区间是.",
    "options": [],
    "answer": "值域 `(-∞,2log₂3]`；增区间 `(-1,2]`",
    "core": -1,
    "guide": "先要求对数真数为正，再配方研究真数的范围和增减。底数会保持还是改变增减方向？"
  },
  {
    "id": "FUNC-SA-0255",
    "chapter": "对数与指数互化",
    "title": "对数函数的图象",
    "type": "SA",
    "stem": "已知函数f(x) = (t - 2)x^{t}是幂函数, 则曲线y = \\log_{a}(x - t) + t(a > 0,a ≠1) 恒过定点.",
    "options": [],
    "answer": "`(4,3)`",
    "core": -1,
    "guide": "先按幂函数的定义确定参数条件，再寻找不随对数底数改变的真数。最后还要考虑平移。"
  },
  {
    "id": "FUNC-SA-0270",
    "chapter": "零点与方程",
    "title": "二分法",
    "type": "SA",
    "stem": "用二分法求函数f(x) = \\ln x + x - 2在区间[1,2]上的零点近似解, 要求精确度为 0.01 时,所需二分区间的次数最少为.",
    "options": [],
    "answer": "最少 7 次",
    "core": -1,
    "guide": "每次二分后区间长度变为原来的一半。写出二分若干次后的长度，再与要求的精确度比较。"
  },
  {
    "id": "FUNC-SA-0284",
    "chapter": "函数基础与表示",
    "title": "函数的值域",
    "type": "SA",
    "stem": "已知函数f(x) = 2^{x} +1（x为实数），求该函数的值域。",
    "options": [],
    "answer": "`(1,+∞)`",
    "core": -1,
    "guide": "指数部分能否等于零？先确定它的范围，再考虑整体向上平移后的边界是否取得。"
  },
  {
    "id": "FUNC-SA-0292",
    "chapter": "函数性质与变化",
    "title": "函数的周期性",
    "type": "SA",
    "stem": "已知函数f(x)是周期为5的周期函数，且f(3) = 7，请完成以下计算： 1、 求f(3 + 10)的值； 2、 求f(8)的值。",
    "options": [],
    "answer": "（1）7；（2）7",
    "core": -1,
    "guide": "把待求输入与已知输入的差写出来。这个差是周期的整数倍吗？"
  },
  {
    "id": "FUNC-SA-0295",
    "chapter": "函数性质与变化",
    "title": "减函数",
    "type": "SA",
    "stem": "已知一次函数f(x) = -3x + 5，求其单调递减区间。",
    "options": [],
    "answer": "`R`，即 `(-∞,+∞)`",
    "core": -1,
    "guide": "先判断一次项系数的符号，再考虑这种变化趋势是否在整个定义域都成立。"
  },
  {
    "id": "FUNC-SA-0299",
    "chapter": "函数性质与变化",
    "title": "减区间",
    "type": "SA",
    "stem": "已知二次函数y = - x^{2} +2x + 1的定义域为全体实数，求该函数的减区间。",
    "options": [],
    "answer": "减区间 `[1,+∞)`；`(1,+∞)`作为常见等价写法接受",
    "core": -1,
    "guide": "根据开口方向和对称轴判断抛物线哪一侧向下走，再写出相应的自变量区间。"
  },
  {
    "id": "FUNC-SA-0301",
    "chapter": "函数性质与变化",
    "title": "减区间",
    "type": "SA",
    "stem": "求下列问题：1. 函数y = |2x - 4|的对称轴是什么？2. 该函数的减区间（定义域为全体实数）是多少？",
    "options": [],
    "answer": "对称轴 `x=2`；减区间 `(-∞,2]`，并接受 `(-∞,2)`",
    "core": -1,
    "guide": "先找绝对值内部变号的位置，按左右两段去掉绝对值，再判断哪一段递减。"
  },
  {
    "id": "FUNC-SA-0303",
    "chapter": "函数最值与应用",
    "title": "函数的最大值",
    "type": "SA",
    "stem": "已知二次函数f(x) = -2x^{2} +6x - 1，请计算该函数的最大值，并写出详细计算过程。",
    "options": [],
    "answer": "`7/2`",
    "core": -1,
    "guide": "配方后观察平方项前的符号。什么时候这部分最大？再检查剩余的常数项。"
  },
  {
    "id": "FUNC-SA-0307",
    "chapter": "函数最值与应用",
    "title": "函数的最大值点",
    "type": "SA",
    "stem": "已知函数f(x) = 5在区间[2,7]上，回答下列问题： 1、 该函数在区间[2,7]上的最大值是多少？ 2、 写出该函数在区间[2,7]上的一个最大值点的横坐标（要求为整数）。",
    "options": [],
    "answer": "（1）5；（2）`2,3,4,5,6,7` 中任一整数",
    "core": -1,
    "guide": "常数函数在整个区间上的高度相同。最大值与最大值点的横坐标分别指什么？"
  },
  {
    "id": "FUNC-SC-0095",
    "chapter": "零点与方程",
    "title": "结合函数图像判断一元二次方程实根的存在性及实根的个数",
    "type": "SC",
    "stem": "关于x的方程x^{2} +2(m - 1)x + m^{2} -m = 0有两个实数根α,β, 且α^{2} + β^{2} = 12, 那么 m的值为",
    "options": [
      {
        "label": "A",
        "text": "$-1$"
      },
      {
        "label": "B",
        "text": "$-4$"
      },
      {
        "label": "C",
        "text": "-4 或 1"
      },
      {
        "label": "D",
        "text": "-1 或 4"
      }
    ],
    "answer": "A（`m=-1`）",
    "core": -1,
    "guide": "用根与系数的关系改写两根的平方和，再检查得到的参数是否满足实根存在条件。"
  },
  {
    "id": "FUNC-SC-0104",
    "chapter": "函数基础与表示",
    "title": "函数三要素",
    "type": "SC",
    "stem": "下列各组函数中, 表示同一函数的是",
    "options": [
      {
        "label": "A",
        "text": "$f(x) = e^{\\ln x},g(x) = x$"
      },
      {
        "label": "B",
        "text": "$f(x) = x\\frac{2}{x} - 4 + 2,g(x) = x - 2$"
      },
      {
        "label": "C",
        "text": "$f(x) = x^{3},g(x) = 1$"
      },
      {
        "label": "D",
        "text": "$f(x) = |x|,x ∈{ - 1,0,1},g(x) = x^{2},x ∈{ - 1,0,1}$"
      }
    ],
    "answer": "D",
    "core": -1,
    "guide": "判断同一函数，要同时比较定义域与对应关系。化简表达式时，哪些原有的取值限制必须保留？"
  },
  {
    "id": "FUNC-SC-0107",
    "chapter": "函数基础与表示",
    "title": "函数三要素",
    "type": "SC",
    "stem": "存在函数f(x)满足: 对任意x ∈R都有",
    "options": [
      {
        "label": "A",
        "text": "$f(|x|) = x^{3}$"
      },
      {
        "label": "B",
        "text": "$f(\\sin x) = x^{2}$"
      },
      {
        "label": "C",
        "text": "$f(x^{2} + 2x) = |x|$"
      },
      {
        "label": "D",
        "text": "$f(|x|) = x^{2} +1$"
      }
    ],
    "answer": "D",
    "core": -1,
    "guide": "同一个输入只能对应一个输出。逐项检查关系式是否对所有实数都成立，有没有矛盾？"
  },
  {
    "id": "FUNC-SC-0145",
    "chapter": "函数基础与表示",
    "title": "解析法",
    "type": "SC",
    "stem": "已知函数h(x)是奇函数，且f(x) = h(x) +2，若x = 2是函数y = f(x)的一个零点, 则f( - 2) =",
    "options": [
      {
        "label": "A",
        "text": "$-4$"
      },
      {
        "label": "B",
        "text": "$0$"
      },
      {
        "label": "C",
        "text": "$2$"
      },
      {
        "label": "D",
        "text": "$4$"
      }
    ],
    "answer": "D",
    "core": -1,
    "guide": "零点给出的是哪个函数的值为零？先还原奇函数在该点的值，再利用相反数处的关系。"
  },
  {
    "id": "FUNC-SC-0171",
    "chapter": "指数与幂的运算",
    "title": "指数函数的性质",
    "type": "SC",
    "stem": "若函数y = (m^{2} - 2m - 2)·m^{x}是指数函数, 则m等于 ( )",
    "options": [
      {
        "label": "A",
        "text": "-1 或 3"
      },
      {
        "label": "B",
        "text": "$-1$"
      },
      {
        "label": "C",
        "text": "$3$"
      },
      {
        "label": "D",
        "text": "$\\frac{1}{3}$"
      }
    ],
    "answer": "C",
    "core": -1,
    "guide": "指数函数要求前面的系数符合标准形式，同时底数为正且不等于一。求出的候选参数要逐一检查。"
  },
  {
    "id": "FUNC-SC-0178",
    "chapter": "指数与幂的运算",
    "title": "指数函数的图象",
    "type": "SC",
    "stem": "函数f(x) = 3a^{x-2} +5(a > 0且a ≠1)的图象恒过定点P, 点P又在幂函数g(x) 的图象上,则g( - 2)的值为（）",
    "options": [
      {
        "label": "A",
        "text": "$-8$"
      },
      {
        "label": "B",
        "text": "$-9$"
      },
      {
        "label": "C",
        "text": "$-\\frac{1}{8}$"
      },
      {
        "label": "D",
        "text": "$-\\frac{1}{9}$"
      }
    ],
    "answer": "A",
    "core": -1,
    "guide": "先令指数为零，找到与底数无关的点。再把点的坐标代入幂函数确定指数。"
  },
  {
    "id": "FUNC-SC-0186",
    "chapter": "对数与指数互化",
    "title": "对数的概念",
    "type": "SC",
    "stem": "下列选项中可以求对数的是（）",
    "options": [
      {
        "label": "A",
        "text": "$- e^{2}$"
      },
      {
        "label": "B",
        "text": "$-\\frac{2}{3}$"
      },
      {
        "label": "C",
        "text": "$0$"
      },
      {
        "label": "D",
        "text": "$5$"
      }
    ],
    "answer": "D",
    "core": -1,
    "guide": "逐项检查底数和真数：底数必须为正且不等于一，真数必须为正。"
  },
  {
    "id": "FUNC-SC-0194",
    "chapter": "对数与指数互化",
    "title": "常用对数",
    "type": "SC",
    "stem": "计算lg1000的值等于：",
    "options": [
      {
        "label": "A",
        "text": "$0.001$"
      },
      {
        "label": "B",
        "text": "$-3$"
      },
      {
        "label": "C",
        "text": "$3$"
      },
      {
        "label": "D",
        "text": "$2.303$"
      }
    ],
    "answer": "C",
    "core": -1,
    "guide": "lg 表示以十为底。把真数写成十的幂，再看对数要寻找的是哪个量。"
  },
  {
    "id": "FUNC-SC-0196",
    "chapter": "对数与指数互化",
    "title": "自然对数",
    "type": "SC",
    "stem": "若ln(x) = 3，则x等于",
    "options": [
      {
        "label": "A",
        "text": "$3^{e}$"
      },
      {
        "label": "B",
        "text": "$\\frac{3}{e}$"
      },
      {
        "label": "C",
        "text": "$10^{3}$"
      },
      {
        "label": "D",
        "text": "$e^{3}$"
      }
    ],
    "answer": "D",
    "core": -1,
    "guide": "ln 表示以自然常数为底。先把对数等式改写成指数等式，再对照选项。"
  },
  {
    "id": "FUNC-SC-0222",
    "chapter": "函数性质与变化",
    "title": "偶函数",
    "type": "SC",
    "stem": "已知函数f(x) = |x + 2| + e^{x+2} + e^{-2-x} +a有唯一零点, 则实数a =",
    "options": [
      {
        "label": "A",
        "text": "$1$"
      },
      {
        "label": "B",
        "text": "$-1$"
      },
      {
        "label": "C",
        "text": "$2$"
      },
      {
        "label": "D",
        "text": "$-2$"
      }
    ],
    "answer": "D",
    "core": -1,
    "guide": "把平移后的自变量看作整体。绝对值和一对互为倒数的正数之和何时同时取最小？唯一零点对应什么情况？"
  },
  {
    "id": "FUNC-SC-0229",
    "chapter": "函数性质与变化",
    "title": "函数的周期性",
    "type": "SC",
    "stem": "已知函数y = f(x)是定义域为R的周期为 3 的奇函数, 且当x ∈(0, \\frac{3}{2})时,f(x) = ln (x^{2} - x + 1), 则方程f(x) = 0在区间[0,6]上的解的个数是",
    "options": [
      {
        "label": "A",
        "text": "$5$"
      },
      {
        "label": "B",
        "text": "$6$"
      },
      {
        "label": "C",
        "text": "$7$"
      },
      {
        "label": "D",
        "text": "$9$"
      }
    ],
    "answer": "D",
    "core": -1,
    "guide": "先在给定的小区间内找零点，再用奇偶性和周期扩展。留意区间端点，避免漏算或重复。"
  },
  {
    "id": "FUNC-SC-0243",
    "chapter": "指数与幂的运算",
    "title": "实数指数幂的运算性质",
    "type": "SC",
    "stem": "若3^{x} = 6,3^{y} = 7, 则3^{x+y} = ( )",
    "options": [
      {
        "label": "A",
        "text": "$14$"
      },
      {
        "label": "B",
        "text": "$21$"
      },
      {
        "label": "C",
        "text": "$42$"
      },
      {
        "label": "D",
        "text": "$48$"
      }
    ],
    "answer": "C",
    "core": -1,
    "guide": "同底数幂相乘时指数相加。怎样把要求的幂拆成两个已知的幂？"
  },
  {
    "id": "FUNC-SC-0245",
    "chapter": "指数与幂的运算",
    "title": "实数指数幂的运算性质",
    "type": "SC",
    "stem": "已知:m^{a} = 2,m^{b} = 3, 则m^{2a+b}值是 ( )",
    "options": [
      {
        "label": "A",
        "text": "$12$"
      },
      {
        "label": "B",
        "text": "$6$"
      },
      {
        "label": "C",
        "text": "$7$"
      },
      {
        "label": "D",
        "text": "$5$"
      }
    ],
    "answer": "12（选项 A）",
    "core": -1,
    "guide": "先把指数中的倍数与加法分别对应到乘方和乘法，再代入已知的幂值。"
  },
  {
    "id": "FUNC-SC-0248",
    "chapter": "指数与幂的运算",
    "title": "实数指数幂的运算性质",
    "type": "SC",
    "stem": "设大于 1 的实数a,b满足a^{a} = 2,(2a)^{2a} = b，则（）",
    "options": [
      {
        "label": "A",
        "text": "$4 < b < 8$"
      },
      {
        "label": "B",
        "text": "$8 < b < 16$"
      },
      {
        "label": "C",
        "text": "$16 < b < 32$"
      },
      {
        "label": "D",
        "text": "$32 < b < 64$"
      }
    ],
    "answer": "D，且 `32<b<64`",
    "core": -1,
    "guide": "先用幂的运算法则拆开含乘积底数的式子，再利用已知等式估计参数范围。"
  },
  {
    "id": "FUNC-SC-0254",
    "chapter": "指数与幂的运算",
    "title": "指数函数的定义",
    "type": "SC",
    "stem": "若指数函数y = f(x)的图象过点(2,4), 则f(3)的值为（)",
    "options": [
      {
        "label": "A",
        "text": "$4$"
      },
      {
        "label": "B",
        "text": "$8$"
      },
      {
        "label": "C",
        "text": "$16$"
      },
      {
        "label": "D",
        "text": "$1$"
      }
    ],
    "answer": "8（选项 B）",
    "core": -1,
    "guide": "指数函数写成底数的自变量次幂。把已知点代入确定合法底数，再求指定输入处的值。"
  },
  {
    "id": "FUNC-SC-0264",
    "chapter": "对数与指数互化",
    "title": "换底公式",
    "type": "SC",
    "stem": "若2^{a} = 5^{b} = z^{c}, 且 \\frac{1}{a} +\\frac{1}{b} =\\frac{1}{c}, 则z的值可能为 ( )",
    "options": [
      {
        "label": "A",
        "text": "$\\sqrt{7}$"
      },
      {
        "label": "B",
        "text": "$\\sqrt{10}$"
      },
      {
        "label": "C",
        "text": "$7$"
      },
      {
        "label": "D",
        "text": "$10$"
      }
    ],
    "answer": "D",
    "core": -1,
    "guide": "把相等的幂设为同一个正数，尝试用这个共同量表示底数，并利用倒数指数的关系。"
  },
  {
    "id": "FUNC-SC-0275",
    "chapter": "对数与指数互化",
    "title": "对数函数的定义",
    "type": "SC",
    "stem": "下列四类函数中，具有性质“对任意的x > 0,y > 0，函数f(x)满足f(xy) = f(x) +f (y)”的是",
    "options": [
      {
        "label": "A",
        "text": "幂函数"
      },
      {
        "label": "B",
        "text": "对数函数"
      },
      {
        "label": "C",
        "text": "指数函数"
      },
      {
        "label": "D",
        "text": "一次函数"
      }
    ],
    "answer": "B",
    "core": -1,
    "guide": "回忆哪一种运算会把乘积转成和。也可以把各候选函数代入关系式逐一验证。"
  },
  {
    "id": "FUNC-SC-0305",
    "chapter": "零点与方程",
    "title": "零点存在定理",
    "type": "SC",
    "stem": "设函数f(x) = 4lnx - x(x > 0), 则y = f(x)满足（)",
    "options": [
      {
        "label": "A",
        "text": "在区间( \\frac{1}{e},1),(1,e)内均有零点"
      },
      {
        "label": "B",
        "text": "在区间( \\frac{1}{e},1)内有零点, 在区间(1,e)内无零点"
      },
      {
        "label": "C",
        "text": "在区间( \\frac{1}{e},1)内无零点, 在区间(1,e)内有零点"
      },
      {
        "label": "D",
        "text": "在区间( \\frac{1}{e},1),(1,e)内均无零点"
      }
    ],
    "answer": "C",
    "core": -1,
    "guide": "先确认定义域，再考察增减与最高点的符号，结合两端趋势判断图像与横轴的关系。"
  },
  {
    "id": "FUNC-SC-0306",
    "chapter": "零点与方程",
    "title": "零点存在定理",
    "type": "SC",
    "stem": "已知函数f(x) = \\ln x + 2x - 5的零点x0 ∈(k,k + 1)，则整数k的值为（）",
    "options": [
      {
        "label": "A",
        "text": "$0$"
      },
      {
        "label": "B",
        "text": "$1$"
      },
      {
        "label": "C",
        "text": "$2$"
      },
      {
        "label": "D",
        "text": "$3$"
      }
    ],
    "answer": "C",
    "core": -1,
    "guide": "先判断函数在定义域内是否单调，再计算相邻整数处的符号，寻找夹住零点的区间。"
  },
  {
    "id": "FUNC-SC-0347",
    "chapter": "函数最值与应用",
    "title": "函数的最大值点",
    "type": "SC",
    "stem": "函数f(x) = \\log_{2}x在区间[1,8]上的最大值点对应的x值是？",
    "options": [
      {
        "label": "A",
        "text": "$1$"
      },
      {
        "label": "B",
        "text": "$2$"
      },
      {
        "label": "C",
        "text": "$4$"
      },
      {
        "label": "D",
        "text": "$8$"
      }
    ],
    "answer": "D",
    "core": -1,
    "guide": "先根据底数判断对数函数的增减。题目问最大值点的横坐标，还是最大函数值？"
  },
  {
    "id": "FUNC-SC-0351",
    "chapter": "函数最值与应用",
    "title": "函数的最小值点",
    "type": "SC",
    "stem": "某商店销售某种商品的成本函数为C(x) = 0.5x^{2} -4x + 20（其中x 为销售量，单位：件，x ≥0），则该商店销售这种商品时，成本最低的销售量为多少件？",
    "options": [
      {
        "label": "A",
        "text": "$2$"
      },
      {
        "label": "B",
        "text": "$4$"
      },
      {
        "label": "C",
        "text": "$20$"
      },
      {
        "label": "D",
        "text": "$5$"
      }
    ],
    "answer": "B",
    "core": -1,
    "guide": "把成本函数配方找出顶点，再检查销售量的范围。题目要填的是销售量而非最低成本。"
  }
];
  // END CATALOG LESSONS
  const lessons = {
    log: [{ rubric: '说明lg是以10为底的对数，lg x=2表示10的二次方是x；用指数与对数互逆说明自己的选择。只报选项或数值不算理解。',
      cues: /对数|指数|次方|平方|底|lg|log|10|十/, questions: [policy.hints.log_concept,
        '换个角度：把对数看成“寻找指数”的问题。这里是谁的指数，又是对哪个量提出的问题？',
        '我们把话补完整：“我先确定底数，再把对数关系改写成……”。请只讲你会怎样改写。'] }],
    quadratic: [
      { rubric: '说明二次项系数k不能为零，因为为零时二次项消失，方程退化成一次方程。必须有原因，不只报k不为零。', cues: /系数|二次|一次|退化|消失|k/,
        questions: [policy.hints.quadratic_type, '换成反过来想：如果最高次项消失了，这还是原来要求的那类方程吗？为什么？',
          '先遮住其他项，只看带平方的那一项。请说说什么会让它消失，以及消失后方程会有什么变化。'] },
      { rubric: '解释两个不相等实根要求判别式严格大于零；等于零是重根，不符合不相等，不能仅说有实根。', cues: /判别式|重根|不相等|大于|正|零|0|Δ|delta/,
        questions: [policy.hints.quadratic_roots, '换成分类比较：有实根和有不相等的实根是同一件事吗？重根属于哪一类？',
          '先用自己的话区分“有交点”和“有两个不同交点”，再把这一区别对应到判别式。'] },
      { rubric: '结合k不为零和判别式4-4k>0求交集，说明k<1且k不等于0，两个边界都不能包含并解释原因。', cues: /交集|同时|边界|k|系数|判别式/,
        questions: [policy.hints.quadratic_combine, '把前面两个要求分别写在两张纸上。一个候选值需要通过一张，还是两张都通过？请说明边界怎样检查。',
          '试着分别检查会让方程类型变化、会让两个根合并的情况，再说哪些情况需要排除。'] }
    ],
    interval: [
      { rubric: '固定a，绝对值是b与a的距离，因此b应取离a更远的区间端点；需要比较两端，不能总取同一端。', cues: /距离|固定|端点|两端|更远|绝对值/,
        questions: [policy.hints.interval_distance, '换成数轴想象：把一个点固定，另一个点只能在区间里移动。怎样让它们尽可能远？',
          '先在纸上画区间并标出固定点，分别比较它到两端的距离。你发现哪种选择需要分类？'] },
      { rubric: '根据固定a到两端距离比较分段，将绝对值分别去掉，在每段研究关于a的二次函数；检查端点与顶点是否在区间内。', cues: /分段|分类|二次|顶点|端点|区间/,
        questions: [policy.hints.interval_cases, '先把两种端点选择分开，各自会留下怎样的单变量函数？你准备用什么方法研究它？',
          '换成画图：分别画每段函数的大致形状，再标出这段允许的位置。哪些地方值得检查？'] },
      { rubric: '比较所有分段区间的候选值并验证可取得，最大值为4且a=2,b=0达到。要有候选比较和可达性，单报4不够。', cues: /比较|候选|端点|达到|取得|最大|4|四/,
        questions: [policy.hints.interval_check, '换成候选清单：每一段的候选位置都列齐了吗？最大的那个能用原题允许的变量取到吗？',
          '请用一个符合范围的取值验证你的结论，再说明为什么其他情形不会更大。'] }
    ]
  };
  for (const item of catalogLessons) {
    lessons[item.id] = [
      { rubric: '针对当前题目说明已知条件、求解目标及所用概念，解释为何可用这个方法。参考方法：' + item.guide,
        cues: /函数|定义|条件|因为|所以|指数|对数|区间|代入|平方|系数|周期|奇|偶|零点|底数/,
        questions: [item.guide, '先只写这道题的已知条件和要求的量，再说你准备采用哪一个定义或关系。', '把你已经写出的第一步和理由发来，我们就从这一处继续。'] },
      { rubric: '针对当前题目给出有依据的变形或计算，并检查定义域、边界及结论。复核参考（不得在回复中公布）：' + item.answer,
        cues: /因为|所以|因此|代入|检验|边界|定义域|满足|计算|得到|相等|取值|范围/,
        questions: ['沿着刚才的方法写出下一步变形，并说明它为什么成立。', '检查这一步有没有改变允许的取值范围；再把候选结果放回原条件。', '请把推导和检验分别写一句，留意题目要的是函数值、位置还是范围。'] }
    ];
  }
  function topic(input) {
    const item = catalogLessons.find(item => item.id === input.questionId || (input.stem || '').startsWith(item.stem));
    if (item) return item.id;
    return /lg|对数/.test(input.stem || '') ? 'log' : /kx|实根/.test(input.stem || '') ? 'quadratic' : /最值|绝对值|\|b/.test(input.stem || '') ? 'interval' : '';
  }
  function initial() { return { phase: 'start', step: 0, attempts: 0, seen: [], evidence: [] }; }
  // Explain concepts directly; never substitute the current exercise's final result.
  const concepts = {
    correct_quadratic_range: '是的，k＜1 这一步没错，但作为完整答案，是不是还少考虑了什么呢？你先想一想，我给你三分钟；如果还没继续，我们再看一个提示。',
    quadratic_start: '题目要求有两个不相等的实根，可以先通过判别式来考虑：判别式应该满足什么条件？你先列出来算一算。',
    confirm_quadratic_nonzero: '是的，k 不能为 0，因为题目要求是一元二次方程；k 为 0 时，二次项就消失了。接下来检查“两个不相等的实根”这个条件，看看判别式应该满足什么要求。',
    correct_quadratic_zero: '这里需要改一下：k 不能为 0，因为 k 为 0 时二次项会消失，就不再是一元二次方程了。先保留这个条件，再检查判别式与两个不相等实根的关系。',
    domain: '定义域是允许输入的自变量取值集合。分母不能为零，偶次根式内不能为负，对数真数必须为正；实际问题还要满足时间、数量等限制。多个条件要同时成立。',
    range: '值域是函数在定义域内所有可能输出的集合。先确定输入范围，再研究输出的上下界，并检查边界能否真正取得。',
    function: '函数要求每个允许的输入都有唯一确定的输出。判断两个表达式是否表示同一函数，要同时比较定义域和对应关系；化简不能丢掉原有的取值限制。',
    monotonic: '递增表示同一区间内输入增大时输出也增大，递减则相反。一次函数看斜率，二次函数结合开口和对称轴；分段函数要分别检查各段以及连接处。',
    parity: '奇函数满足 f(−x)=−f(x)，偶函数满足 f(−x)=f(x)，两者都要求定义域关于零对称。整体平移后的函数要先明确哪个表达式被称为奇函数或偶函数。',
    period: '周期 T 要满足 T 不为零，并且对允许的输入都有 f(x+T)=f(x)。平移后符号相反还不是周期关系，可以再平移一次检查。题目说“一个周期”与“最小正周期”要求不同。',
    zero: '零点是让函数值等于零的自变量，不是坐标点。它对应方程 f(x)=0 的解，也对应图像与横轴交点的横坐标。',
    bisection: '连续函数在区间两端异号时，区间内至少有一个零点。二分法每次取中点，保留两端异号的半段；二分 n 次后的区间长度是初始长度除以 2 的 n 次方。',
    power_rules: '同底数幂相乘，指数相加；幂的乘方，指数相乘。把复杂指数拆成已知指数的组合之前，要检查底数和指数的适用条件，正底数可使用实数指数运算法则。',
    exp_function: '指数函数的标准形式是 y=aˣ，其中 a>0 且 a≠1。a>1 时递增，0<a<1 时递减；值总为正。幂函数则是 y=xᵅ，自变量位于底数，二者不能混淆。',
    log_rules: '对数的底数必须为正且不等于一，真数必须为正。同底对数相加对应真数相乘，相减对应相除；换底公式是 logₐb=log꜀b/log꜀a，所用底数都要合法。',
    roots_relation: '对于 ax²+bx+c=0 且 a≠0，两个根的和是 −b/a，积是 c/a。平方和可写成“和的平方减去两倍的积”；涉及实根时，还要检查判别式。',
    discriminant: '判别式用来区分一元二次方程的根。对于 ax²+bx+c=0，判别式是 b²−4ac：为正时有两个不同的实根，为零时两个根重合，为负时没有实根。这里的 a、b、c 是一般方程的系数，还需要你自己对应到题目。',
    coefficient: '系数就是乘在字母或字母幂前面的数或参数。二次项指含未知数平方的那一项；如果它的系数为零，这一项就消失，方程便不再是二次方程。',
    repeated_root: '重根指两个求根结果相同，实际只有一个不同的实数解。从图像看，就是抛物线与横轴相切；“两个不相等的实根”则对应两个不同的交点。',
    intersection: '取交集就是只保留同时满足所有条件的值。可以把每个条件分别画在数轴上，最后取它们重合的部分；某个条件排除的边界也要一起排除。',
    logarithm: '对数是在问“底数的几次方会得到真数”。写成 logₐb=c，意思就是 aᶜ=b；a 是底数，b 是真数，c 是指数。lg 是以十为底的对数的简写。',
    exponent: '指数表示同一个数连乘时使用多少个因子。底数是被重复相乘的数，幂是计算结果。把对数关系改写成指数关系，只是换一种方式描述同一关系，不是把几个量直接相乘。',
    absolute: '绝对值表示数轴上的距离，所以结果不会是负数。两个数之差的绝对值表示它们之间的距离，不必先确定谁在左边；去掉绝对值符号前，要先判断里面的式子是什么符号。',
    endpoints: '端点就是区间两端的位置。固定区间内的一个点后，它离另一个移动点的距离，会在某一端达到最大；具体是哪一端，要比较到两端的距离，不能总选同一端。',
    piecewise: '分类讨论是把会改变表达式形式的情况分开。例如绝对值里面的式子非负时保持原式，为负时取相反数。每一类都要写清适用条件，再在自己的范围里分析。',
    vertex: '二次函数的顶点是抛物线改变增减方向的位置。求一个有限闭区间上的最值时，要比较区间端点，以及落在区间内的顶点；区间外的顶点不能作为候选。',
    why_ask: '请你讲依据，是为了区分“这次选对了”和“知道为什么”。你也可以随时说“回到作答”，先自己尝试；不需要一直留在对话里。',
    greeting: '你好，我在。你可以直接问概念、符号或某一步的原因，我会先解释你问的部分。',
    answer_request: '这道题的最终答案留给你完成。你可以指定需要解释的概念、符号或步骤，我会直接讲清那一部分。',
    clarify: '这句话里要解释的对象还不够明确。请贴出具体的词、式子或那一步，我会围绕它说明。'
  };
  const examples = {
    discriminant: '例如 y²−3y+2=0 的判别式为 9−8，是正数，所以有两个不同实根；y²−2y+1=0 的判别式为零，两个根重合。这是帮助理解判别式的另一组方程。',
    coefficient: '例如 5t²+3t−7=0 中，二次项是 5t²，二次项系数是 5，一次项系数是 3。系数可以是字母参数，但仍表示乘在那一项前面的量。',
    logarithm: '换一道小例子：因为 2³=8，所以 log₂8=3。对数问的是“2 的几次方得到 8”，而不是让 2 和 8 相乘。',
    exponent: '例如 3⁴ 表示四个 3 连乘；3 是底数，4 是指数。“四次方”不是乘以四。',
    absolute: '例如数轴上 −3 和 1 的距离是 |−3−1|。距离不区分朝左还是朝右，所以要取绝对值。',
    intersection: '例如一个条件要求数值大于 3，另一个要求小于 8，交集就是同时满足两个要求的部分。画数轴时保留两段重叠的位置。'
  };
  function questionRoute(input) {
    if (input.turn === 'submission') return null;
    const q = utterance(input);
    if (/^(你好|您好|嗨|hello|hi)[!！。\s]*$/i.test(q)) return 'greeting';
    if (/为什么.*(问我|一直问|重复|解释)|不要.*(重复|一直问)|总是.*问/.test(q)) return 'why_ask';
    if (/直接.*(答案|结果)|告诉我.*(答案|结果)|答案.*是什么|求.*取值范围/.test(q)) return 'answer_request';
    // Confirm only a reviewed intermediate claim in the matching exercise context.
    // Anchor the whole utterance so negation, extra claims and instructions cannot be endorsed.
    const confirmation = q.normalize('NFKC').replace(/\s+/g, '');
    const proposedRange = confirmation.replace(/^(?:(?:哦|噢|喔|嗯|啊|那么|那|所以|也就是说|这么说|我觉得|我算出来|我算出)|[,，:：])+/u, '');
    const stem = String(input.stem || '').replace(/[\s{}]/g, '').replace(/−/g, '-');
    if (topic(input) === 'quadratic' && /(?:这道题|这题|题目).*(?:怎么想|怎么做|如何|怎样|思路)|^(?:应该)?怎么想[?？]?$/.test(q)) return 'quadratic_start';
    if (topic(input) === 'quadratic' && /kx(?:²|\^2)-2x\+1=0/.test(stem) && /一元二次方程/.test(stem) && /不相等/.test(stem) &&
        /^(?:答案|结果|取值范围)?(?:难道不是|不就是|应该是|是不是|是|为)?k(?:<|小于)(?:1|一)[,，]?(?:吗|吧|对吗|对吧|是吗|是吧|是答案吗|对不对|没错吧)?[?？!！。]*$/i.test(proposedRange)) return 'correct_quadratic_range';
    if (topic(input) === 'quadratic' && /一元二次方程/.test(input.stem || '') && /kx(?:²|\^\{?2\}?)/.test((input.stem || '').replace(/\s+/g, ''))) {
      const claim = confirmation.match(/^(?:(?:这么说|也就是说|所以|那|那么|我|是|要|应该|需要|考虑|只考虑|先考虑|的情况|,|，))*k(不为|不等于|不能为|不能等于|≠|!=|可以为|可以等于|等于|为|=)(?:0|零)(?:的情况)?[,，]?(?:对吧|对吗|是吧|是吗|是不是|没错吧)[?？!！。]*$/i);
      if (claim) return /^(?:不|≠|!=)/.test(claim[1]) ? 'confirm_quadratic_nonzero' : 'correct_quadratic_zero';
    }
    if (!/什么|怎么|怎样|为何|为什么|多少|意思|解释|讲讲|说说|区别|举例|[?？]|不懂|不明白|没懂|不理解/.test(q)) return null;
    let target = q;
    if (/^(这|它|那|刚才)|举例|例子/.test(q) && !/判别式|对数|系数|重根|指数|绝对值|端点|顶点/.test(q)) {
      target += ' ' + (input.history || []).filter(t => t.role === 'assistant').slice(-1).map(t => t.content).join('');
    }
    if (/重根|相等.*根|根.*相等/.test(target)) return 'repeated_root';
    if (/定义域|输入范围/.test(target)) return 'domain';
    if (/值域|输出范围/.test(target)) return 'range';
    if (/单调|递增|递减|增区间|减区间|斜率/.test(target)) return 'monotonic';
    if (/奇函数|偶函数|奇偶/.test(target)) return 'parity';
    if (/周期/.test(target)) return 'period';
    if (/二分|精确度|零点存在/.test(target)) return 'bisection';
    if (/零点/.test(target)) return 'zero';
    if (/换底|对数.*(运算|相加|相减)|真数.*(正|条件)/.test(target)) return 'log_rules';
    if (/指数函数|幂函数/.test(target)) return 'exp_function';
    if (/同底|幂.*(运算|相乘)|指数.*相加/.test(target)) return 'power_rules';
    if (/韦达|根与系数|根的和|根的积/.test(target)) return 'roots_relation';
    if (/三要素|同一函数|对应关系|函数是什么/.test(target)) return 'function';
    if (/判别式|实根|Δ|delta/i.test(target)) return 'discriminant';
    if (/系数|二次项|一次方程|退化|k.*(零|0)/.test(target)) return 'coefficient';
    if (/交集|同时满足|边界/.test(target)) return 'intersection';
    if (/指数|次方|幂/.test(target) && !/对数|lg|log/.test(target)) return 'exponent';
    if (/对数|底数|真数|lg|log/i.test(target)) return 'logarithm';
    if (/端点|两端|更远/.test(target)) return 'endpoints';
    if (/分段|分类|去掉.*绝对值/.test(target)) return 'piecewise';
    if (/绝对值|距离/.test(target)) return 'absolute';
    if (/顶点|最值|最大|最小/.test(target)) return 'vertex';
    // A bare "still confused" belongs to the current coaching step, not a new question.
    if (/^(我)?(还是|仍然|依然|还)?(不懂|不明白|没懂|不理解)([，,。!！\s]|$)/.test(q)) return null;
    return 'clarify';
  }
  function routeOptions(input) {
    // Explicit concept questions are handled by questionRoute. Only ambiguous
    // model routing is constrained here, so a learner may still change subjects.
    const scoped = {
      quadratic: ['coefficient', 'discriminant', 'repeated_root', 'roots_relation', 'intersection'],
      log: ['logarithm', 'exponent', 'log_rules', 'power_rules'],
      interval: ['absolute', 'endpoints', 'piecewise', 'vertex', 'domain', 'range']
    }[topic(input)];
    return scoped ? [...scoped, 'clarify'] : Object.keys(concepts).filter(key => !/^(confirm_|correct_|quadratic_start)/.test(key));
  }
  function choiceAssessment(value) {
    const text = String(value || '').normalize('NFKC').trim();
    const choice = text.match(/^(?:我)?(?:选择|选|答案是|答案为)?\s*([ABCD])(?:[。,.，\s]|$)/i);
    if (choice) return choice[1].toUpperCase() === 'B' ? 'correct' : 'incorrect';
    if (/^(?:100|一百)$/.test(text) || /\bx\s*(?:=|是|为|等于)\s*(?:100|一百)(?=$|[，,。\s]|因为|所以)/.test(text)) return 'correct';
    if (/^(?:x\s*(?:=|是|为|等于)\s*)?-?(?:\d+(?:\.\d+)?|e\^?2)[。！!\s]*$/i.test(text)) return 'incorrect';
    return 'unknown';
  }
  function finalAssessment(input) {
    const text = utterance(input).normalize('NFKC').trim();
    // Only grade an asserted conclusion. Questions, alternatives and negated claims
    // must not finish coaching merely because they contain a correct answer token.
    if (!text || /[?？]|对吧|对吗|是吗|是不是|为什么|怎么|不确定|可能|猜|不是|不对|错误|或者|或许/.test(text)) return 'unknown';
    const conclusion = text.split(/所以|因此|故|最终|答案(?:应该|应当)?(?:是|为|[:：])|取值范围(?:是|为|[:：])/).pop().trim()
      .replace(/[。!！]+$/, '').replace(/^为/, '').replace(/[$`\s]/g, '');
    const key = topic(input);
    const stem = String(input.stem || '').replace(/[\s{}]/g, '').replace(/−/g, '-');
    if (key === 'quadratic' && /kx(?:²|\^2)-2x\+1=0/.test(stem) && /不相等/.test(stem)) {
      const range = conclusion.replace(/小于/g, '<').replace(/不等于|不为|不能为|!=/g, '≠').replace(/零/g, '0').replace(/一/g, '1')
        .replace(/并且|而且|且|同时|和|与/g, '&').replace(/属于/g, '∈');
      return /^(?:k<1[&,]k≠0|k≠0[&,]k<1|(?:k∈)?\(-∞,0\)∪\(0,1\))$/.test(range) ? 'correct' : 'unknown';
    }
    if (key === 'log' && /lgx=2/.test(stem)) {
      if (/^(?:(?:我)?(?:选择|选))?[ABCD]$/i.test(conclusion)) return conclusion.slice(-1).toUpperCase() === 'B' ? 'correct' : 'incorrect';
      if (/^(?:x(?:=|是|为|等于))?(?:100|一百)$/.test(conclusion)) return 'correct';
      return 'unknown';
    }
    if (key === 'interval' && /a.*b.*\[0,2\]/.test(stem) && /a(?:²|\^2)-a\+\|b-a\|/.test(stem)) {
      return /^(?:最大值(?:是|为|等于|=))?(?:4|四)$/.test(conclusion) ? 'correct' : 'unknown';
    }
    const item = catalogLessons.find(item => item.id === key);
    if (item?.type === 'SC') {
      const choice = conclusion.match(/^(?:我)?(?:选择|选)?([A-D])$/i);
      const answer = item.answer.match(/^([A-D])(?:$|[^A-Za-z])/) || item.answer.match(/选项\s*([A-D])/);
      if (choice && answer) return choice[1].toUpperCase() === answer[1] ? 'correct' : 'incorrect';
    }
    return 'unknown';
  }
  function answerFeedback(value) {
    const assessment = choiceAssessment(value);
    const text = String(value || '').normalize('NFKC').trim();
    const choice = text.match(/^(?:我)?(?:选择|选|答案是|答案为)?\s*([ABCD])(?:[。,.，\s]|$)/i);
    const selected = choice ? choice[1].toUpperCase() : text.replace(/^x\s*(?:=|是|为|等于)\s*/i, '').replace(/[。！!\s]+$/, '');
    if (assessment === 'correct') return '你做对了！这道题的引导结束，可以进入下一题。';
    if (assessment === 'unknown') return '还无法从这段思路确定你的最终选择。请单独填写 A、B、C、D 或 x 的数值，再提交检查。';
    if (['A', '2'].includes(selected)) return '若 x = 2，lg 2 并不等于 2。题目中的 2 是指数，不是真数 x；请先确定 lg 的底数，再改写为指数关系。';
    if (['C', '0.01'].includes(selected)) return '若 x = 0.01，lg x = −2，与题目要求的 2 符号相反。请检查指数的正负：正指数与负指数对应的大小不同。';
    if (['D', 'e²', 'e2', 'e^2'].includes(selected)) return 'e 的二次方对应的是 ln x = 2。题目写的是 lg，以 10 为底；这里要区分常用对数 lg 和自然对数 ln 的底数。';
    return '这个数值不满足 lg x = 2。lg 的底数是 10，右侧的 2 表示指数；请把对数式改写成指数式，再核对计算。';
  }
  function isClosure(value) {
    const text = String(value || '').normalize('NFKC').trim();
    if (/不明白|没懂|不懂|不理解|什么|为什么|怎么|[?？]/.test(text)) return false;
    return /^(?:好(?:的)?|可以|我(?:明白|懂了|理解了)|明白了|懂了|知道了|清楚了|了解了|行了|没问题|我会了|我知道了|自己明白)(?:[，,：:、\s]*(?:我)?(?:明白了|懂了|理解了|知道了|自己来|自己做|来做))?[。！!，,。\s]*$/i.test(text) ||
      /^(我)?(先|自己)?(想|做|试|写|回到作答|重新作答)/.test(text) && (/(明白|懂|理解|可以|好|自己)/.test(text) || /回到作答|重新作答/.test(text));
  }
  function normalize(value, input) {
    const t = value || {}, count = (lessons[topic(input)] || []).length;
    return { phase: ['start', 'explain', 'guide', 'complete', 'reframe'].includes(t.phase) ? t.phase : 'start',
      step: Number.isInteger(t.step) ? Math.max(0, Math.min(t.step, Math.max(0, count - 1))) : 0,
      attempts: Number.isInteger(t.attempts) ? Math.max(0, Math.min(t.attempts, 20)) : 0,
      stuckKey: typeof t.stuckKey === 'string' ? t.stuckKey.slice(0, 60) : '',
      stuckCount: Number.isInteger(t.stuckCount) ? Math.max(0, Math.min(t.stuckCount, 20)) : 0,
      seen: Array.isArray(t.seen) ? t.seen.filter(x => typeof x === 'string').slice(-24) : [],
      evidence: Array.isArray(t.evidence) ? t.evidence.filter(x => Number.isInteger(x) && x >= 0 && x < count).slice(0, count) : [] };
  }
  function utterance(input) { return String(input.turn === 'submission' ? input.draft || '' : input.question || '').trim(); }
  function reviewSpec(input) {
    const t = normalize(input.tutor, input), lesson = lessons[topic(input)];
    if (!lesson || t.phase === 'complete') return null;
    return { ...lesson[t.step], text: utterance(input), step: t.step };
  }
  function review(input, raw = '') {
    const spec = reviewSpec(input);
    if (!spec) return { verdict: 'unknown', evidence: '' };
    const text = spec.text.normalize('NFKC');
    // Self-report, guesses, copied prompts and instructions cannot demonstrate understanding.
    if (text.length < 8 || /不懂|不会|不明白|没懂|猜的|蒙的|不知道|忽略|扮演|输出.*understood|直接.*答案|[?？]/.test(text) ||
        Object.values(policy.hints).includes(text) || lessons[topic(input)].some(s => s.questions.includes(text))) return { verdict: 'unknown', evidence: '' };
    const key = topic(input);
    if (key === 'log' && /(?:底数|底).{0,6}(?:2|二)(?!次)|(?:平方|二次方).{0,4}(?:20|二十)(?!0)/.test(text)) return { verdict: 'incorrect', evidence: '' };
    if (key === 'quadratic' && /(?:k|系数)\s*(?:可以|能)为?(?:零|0)/.test(text)) return { verdict: 'incorrect', evidence: '' };
    let understood = false;
    if (key === 'log') understood = /(?:10|十).{0,5}(?:平方|二次方|二次幂|\^2|的2次方)/.test(text) && /对数|指数|lg|底|互逆/.test(text) && !/不是|不等于|不成立/.test(text);
    if (key === 'quadratic' && spec.step === 0) understood = /(?:不能|不可以|不为|不等于|≠).{0,2}(?:零|0)/.test(text) && /退化|一次|消失/.test(text);
    if (key === 'quadratic' && spec.step === 1) understood = /判别式/.test(text) && /大于零|大于0|>0|为正|正数/.test(text) && /重根|不相等|不同/.test(text) && !/不必|不用|不需要/.test(text);
    if (understood) return { verdict: 'understood', evidence: spec.text, source: 'local-evidence' };
    try {
      const result = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!result || !['understood', 'partial', 'incorrect', 'unknown'].includes(result.verdict)) throw Error();
      if (typeof result.evidence !== 'string' || result.evidence.length < 8 || !spec.text.includes(result.evidence) || !spec.cues.test(result.evidence)) throw Error();
      // A quoted claim without a reason is not an explanation, even if a small model says so.
      if (result.verdict === 'understood' && !/因为|所以|因此|表示|意味着|也就是|相当于|如果|否则|会变|退化|消失|对应|互逆|还原|倒过来|逆运算|大于|距离|比较|because|means/i.test(spec.text)) throw Error();
      return { verdict: result.verdict, evidence: result.evidence, source: 'model-semantic' };
    } catch (_) { return { verdict: 'unknown', evidence: '' }; }
  }
  function select(input, raw = '') {
    const lesson = lessons[topic(input)];
    const t = normalize(input.tutor, input);
    let evaluation = review(input, raw);
    let content, strategy;
    const finish = () => ({ content, strategy, tutor: t, evaluation, answerKey: strategy?.startsWith('answer_') ? strategy.slice(7) : undefined, policyVersion: 'tutoring-guardrails-v3',
      source: evaluation.source || 'guided-fallback' });
    if (finalAssessment(input) === 'correct') {
      t.phase = 'complete'; t.attempts = 0; t.stuckCount = 0; t.stuckKey = '';
      evaluation = { verdict: 'unknown', evidence: '' };
      content = '你做对了！这道题的引导结束，可以进入下一题。'; strategy = 'answer_correct';
      return finish();
    }
    const route = questionRoute(input);
    if (route) evaluation = { verdict: 'unknown', evidence: '' };
    const confused = input.turn !== 'submission' && /还是不懂|仍然不懂|依然不懂|还不明白|还是不明白|还是没懂|仍然没懂|一直不懂|还是不理解/.test(utterance(input));
    const stuckKey = route && route !== 'clarify' ? route : topic(input) + ':' + t.step;
    t.stuckCount = confused ? (t.stuckKey === stuckKey ? t.stuckCount + 1 : 1) : 0;
    t.stuckKey = confused ? stuckKey : '';
    if (t.phase === 'reframe') t.phase = 'guide'; // Recover old persisted exhaustion state.
    if (route) {
      let answerKey = route;
      if (route === 'clarify') {
        try {
          const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
          if (parsed && routeOptions(input).includes(parsed.answerKey)) answerKey = parsed.answerKey;
        } catch (_) {}
      }
      content = /例子|举例|例如/.test(utterance(input)) && examples[answerKey] ? examples[answerKey] : concepts[answerKey];
      if (confused && t.stuckCount > 1 && examples[answerKey]) content = examples[answerKey];
      if (confused && t.stuckCount === 3) content += '\n先把这段说明分成“对象是什么”和“它有什么作用”两部分，指出其中哪个词或哪一步让你困惑，我会从那里继续。';
      strategy = 'answer_' + answerKey;
      if (confused && t.stuckCount >= 4) { t.phase = 'reframe'; content += '\n这个点连续几次仍没讲清，可以点“换种方式重新来”换一个角度。'; }
      return finish();
    }
    if (!lesson) return { ...policy.select(input, raw), tutor: t };
    if (t.phase === 'complete') { content = '这一题的关键依据已经讲清楚，可以进入下一题。'; strategy = 'complete'; return finish(); }
    if (/有点累|烦躁|想休息/.test(utterance(input))) { content = policy.hints.rest; strategy = 'rest'; return finish(); }
    if (t.phase === 'start' && (input.assessment === 'correct' || evaluation.verdict === 'understood')) {
      t.phase = 'explain'; t.attempts = 0; strategy = 'explain';
      content = '这一步的表达是正确的。请用自己的话讲一讲为什么这样做，说明依据即可，不用重复答案。';
      t.seen.push(strategy); return finish();
    }
    if (t.phase !== 'start' && evaluation.verdict === 'understood') {
      t.evidence = [...new Set(t.evidence.concat(t.step))];
      t.attempts = 0;
      if (t.step === lesson.length - 1) {
        t.phase = 'complete'; content = '这段解释把关键依据讲清楚了。这一题可以到这里，接下来进入下一题。'; strategy = 'complete'; return finish();
      }
      t.step++; t.phase = 'guide';
      strategy = topic(input) + '_' + t.step + '_0';
      content = '这一步的依据已经讲清楚，我们继续。' + lesson[t.step].questions[0];
      t.seen.push(strategy); return finish();
    }
    t.phase = t.phase === 'explain' ? 'explain' : 'guide';
    let index = lesson[t.step].questions.findIndex((_, i) => !t.seen.includes(topic(input) + '_' + t.step + '_' + i));
    if (confused && t.stuckCount >= 4) {
      t.phase = 'reframe'; strategy = 'reframe';
      content = '我们先停一下，不再重复追问这个点。可以点“换种方式重新来”，从一个更小的步骤开始，也可以先休息。';
      return finish();
    }
    if (index < 0) {
      // Running out of templates is not evidence of being stuck. Explain this step instead.
      if (catalogLessons.some(item => item.id === topic(input))) {
        content = lesson[t.step].questions[0] + '\n可以只发你最不确定的一步，或直接问其中的概念。'; strategy = 'catalog_check'; return finish();
      }
      const key = topic(input) === 'log' ? 'logarithm' : topic(input) === 'quadratic' ? ['coefficient', 'discriminant', 'intersection'][t.step] : ['absolute', 'piecewise', 'vertex'][t.step];
      content = concepts[key]; strategy = 'answer_' + key; return finish();
    }
    strategy = topic(input) + '_' + t.step + '_' + index;
    content = (evaluation.verdict === 'incorrect' ? '这段解释还有一处需要检查。' : '') + lesson[t.step].questions[index];
    t.attempts++; t.seen.push(strategy); return finish();
  }
  const api = { initial, normalize, topic, reviewSpec, review, select, choiceAssessment, finalAssessment, answerFeedback, isClosure, questionRoute, routeOptions, concepts };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LearningFlow = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
