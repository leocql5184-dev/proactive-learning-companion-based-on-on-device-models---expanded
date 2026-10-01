'use strict';
// BEGIN REVIEWED CATALOG
const reviewedCatalog = [
  {
    "id": "FUNC-FB-0032",
    "chapter": "零点与方程",
    "title": "结合函数图像判断一元二次方程实根的存在性及实根的个数",
    "type": "FB",
    "stem": "若关于x的一元二次方程kx^{2} -2x + 1 = 0有两个不相等的实根，则实数k 的取值范围是_____。",
    "options": [],
    "answer": "`k<1且k≠0`，即 `(-∞,0)∪(0,1)`",
    "core": 0
  },
  {
    "id": "FUNC-FB-0051",
    "chapter": "零点与方程",
    "title": "函数的零点与方程根的关系",
    "type": "FB",
    "stem": "已知一次函数f(x) = ax - 1的零点是x = 2，则a的值为_____（填最简分数）",
    "options": [],
    "answer": "`1/2`",
    "core": -1
  },
  {
    "id": "FUNC-FB-0068",
    "chapter": "函数性质与变化",
    "title": "函数的周期性",
    "type": "FB",
    "stem": "若函数f(x)满足f(x + 1) = -f(x)对任意x ∈R成立，则f(x)的一个周期是_____。",
    "options": [],
    "answer": "2",
    "core": -1
  },
  {
    "id": "FUNC-FB-0073",
    "chapter": "函数性质与变化",
    "title": "减函数",
    "type": "FB",
    "stem": "若函数f(x) = mx + 1在R上是减函数，则实数m的取值范围是_____",
    "options": [],
    "answer": "`m<0`",
    "core": -1
  },
  {
    "id": "FUNC-FB-0091",
    "chapter": "函数最值与应用",
    "title": "函数的最小值",
    "type": "FB",
    "stem": "函数f(x) = -3x + 1，x ∈[0,4]的最小值是_____。",
    "options": [],
    "answer": "-11",
    "core": -1
  },
  {
    "id": "FUNC-FB-0092",
    "chapter": "函数最值与应用",
    "title": "函数的最小值",
    "type": "FB",
    "stem": "函数f(x) = x^{2} -4x + 5的最小值是_____。",
    "options": [],
    "answer": "1",
    "core": -1
  },
  {
    "id": "FUNC-FB-0093",
    "chapter": "函数最值与应用",
    "title": "函数的最小值",
    "type": "FB",
    "stem": "函数f(x) = 7，x ∈R的最小值是_____。",
    "options": [],
    "answer": "7",
    "core": -1
  },
  {
    "id": "FUNC-FB-0096",
    "chapter": "函数最值与应用",
    "title": "函数的最小值点",
    "type": "FB",
    "stem": "小明跑步时消耗的能量与时间t（单位：分钟）的函数关系为f(t) = t^{2} -6t + 10 （t ≥0），则小明消耗能量最少时的时间t值为_____。",
    "options": [],
    "answer": "3",
    "core": -1
  },
  {
    "id": "FUNC-SA-0026",
    "chapter": "零点与方程",
    "title": "结合函数图像判断一元二次方程实根的存在性及实根的个数",
    "type": "SA",
    "stem": "已知函数f(x) = x^{2} -2mx + m^{2} -1，其中m为实数。 1、 试判断方程f(x) = 0的实根个数； 2、 若方程f(x) = 0的两个实根均大于-2且小于4，求实数m的取值范围。",
    "options": [],
    "answer": "（1）2 个不等实根；（2）`-1<m<3`",
    "core": -1
  },
  {
    "id": "FUNC-SA-0112",
    "chapter": "指数与幂的运算",
    "title": "解析法",
    "type": "SA",
    "stem": "正数a,b满足2^{a} - 4^{b} = \\log_{2}b - \\log_{2}a, 则a与2b大小关系为",
    "options": [],
    "answer": "`a<2b`",
    "core": -1
  },
  {
    "id": "FUNC-SA-0139",
    "chapter": "函数最值与应用",
    "title": "函数的最大值点",
    "type": "SA",
    "stem": "已知a,b ∈[0,2]，则a^{2} -a + |b - a|的最大值为.",
    "options": [],
    "answer": "4",
    "core": 2
  },
  {
    "id": "FUNC-SA-0147",
    "chapter": "指数与幂的运算",
    "title": "指数函数的性质",
    "type": "SA",
    "stem": "若函数y = (k + 2)a^{x} +2 - b(a > 0，且a ≠1)是指数函数，则k = ( )，b = ( ).",
    "options": [],
    "answer": "`k=-1，b=2`",
    "core": -1
  },
  {
    "id": "FUNC-SA-0171",
    "chapter": "对数与指数互化",
    "title": "自然对数",
    "type": "SA",
    "stem": "解方程：\\ln (x + 1) - \\ln (x) = \\ln (3)",
    "options": [],
    "answer": "`x=1/2`",
    "core": -1
  },
  {
    "id": "FUNC-SA-0193",
    "chapter": "函数性质与变化",
    "title": "奇函数",
    "type": "SA",
    "stem": "函数y = f(x + 1) + 2是定义域为R的奇函数, 则f(e) +f(2 - e) =.",
    "options": [],
    "answer": "-4",
    "core": -1
  },
  {
    "id": "FUNC-SA-0202",
    "chapter": "函数性质与变化",
    "title": "偶函数",
    "type": "SA",
    "stem": "已知函数f(x)满足f(x) = f(2 - x), 且f(x)是偶函数, 在[0,1]上有f(x) = 2^{x} -1, 则 f(5) =.",
    "options": [],
    "answer": "1",
    "core": -1
  },
  {
    "id": "FUNC-SA-0215",
    "chapter": "函数基础与表示",
    "title": "函数的形成与发展",
    "type": "SA",
    "stem": "《九章算术》是中国古代重要的数学著作，其中记载了这样一个问题：’今 有粟一斗，欲为粝米，问得几何？’已知粟米的出米率是 \\frac{3}{5}。若设粟的数量为x 斗，出米数量为y斗，请解答下列问题： 1、 建立y与x之间的函数关系； 2、 计算当x = 5斗时的出米量。",
    "options": [],
    "answer": "`y=3x/5（x≥0）`；当 `x=5` 时 `y=3`",
    "core": -1
  },
  {
    "id": "FUNC-SA-0252",
    "chapter": "对数与指数互化",
    "title": "对数函数的性质",
    "type": "SA",
    "stem": "函数y = \\log_{2}(5 + 4x - x^{2})的值域为，单调递增区间是.",
    "options": [],
    "answer": "值域 `(-∞,2log₂3]`；增区间 `(-1,2]`",
    "core": -1
  },
  {
    "id": "FUNC-SA-0255",
    "chapter": "对数与指数互化",
    "title": "对数函数的图象",
    "type": "SA",
    "stem": "已知函数f(x) = (t - 2)x^{t}是幂函数, 则曲线y = \\log_{a}(x - t) + t(a > 0,a ≠1) 恒过定点.",
    "options": [],
    "answer": "`(4,3)`",
    "core": -1
  },
  {
    "id": "FUNC-SA-0270",
    "chapter": "零点与方程",
    "title": "二分法",
    "type": "SA",
    "stem": "用二分法求函数f(x) = \\ln x + x - 2在区间[1,2]上的零点近似解, 要求精确度为 0.01 时,所需二分区间的次数最少为.",
    "options": [],
    "answer": "最少 7 次",
    "core": -1
  },
  {
    "id": "FUNC-SA-0284",
    "chapter": "函数基础与表示",
    "title": "函数的值域",
    "type": "SA",
    "stem": "已知函数f(x) = 2^{x} +1（x为实数），求该函数的值域。",
    "options": [],
    "answer": "`(1,+∞)`",
    "core": -1
  },
  {
    "id": "FUNC-SA-0292",
    "chapter": "函数性质与变化",
    "title": "函数的周期性",
    "type": "SA",
    "stem": "已知函数f(x)是周期为5的周期函数，且f(3) = 7，请完成以下计算： 1、 求f(3 + 10)的值； 2、 求f(8)的值。",
    "options": [],
    "answer": "（1）7；（2）7",
    "core": -1
  },
  {
    "id": "FUNC-SA-0295",
    "chapter": "函数性质与变化",
    "title": "减函数",
    "type": "SA",
    "stem": "已知一次函数f(x) = -3x + 5，求其单调递减区间。",
    "options": [],
    "answer": "`R`，即 `(-∞,+∞)`",
    "core": -1
  },
  {
    "id": "FUNC-SA-0299",
    "chapter": "函数性质与变化",
    "title": "减区间",
    "type": "SA",
    "stem": "已知二次函数y = - x^{2} +2x + 1的定义域为全体实数，求该函数的减区间。",
    "options": [],
    "answer": "减区间 `[1,+∞)`；`(1,+∞)`作为常见等价写法接受",
    "core": -1
  },
  {
    "id": "FUNC-SA-0301",
    "chapter": "函数性质与变化",
    "title": "减区间",
    "type": "SA",
    "stem": "求下列问题：1. 函数y = |2x - 4|的对称轴是什么？2. 该函数的减区间（定义域为全体实数）是多少？",
    "options": [],
    "answer": "对称轴 `x=2`；减区间 `(-∞,2]`，并接受 `(-∞,2)`",
    "core": -1
  },
  {
    "id": "FUNC-SA-0303",
    "chapter": "函数最值与应用",
    "title": "函数的最大值",
    "type": "SA",
    "stem": "已知二次函数f(x) = -2x^{2} +6x - 1，请计算该函数的最大值，并写出详细计算过程。",
    "options": [],
    "answer": "`7/2`",
    "core": -1
  },
  {
    "id": "FUNC-SA-0307",
    "chapter": "函数最值与应用",
    "title": "函数的最大值点",
    "type": "SA",
    "stem": "已知函数f(x) = 5在区间[2,7]上，回答下列问题： 1、 该函数在区间[2,7]上的最大值是多少？ 2、 写出该函数在区间[2,7]上的一个最大值点的横坐标（要求为整数）。",
    "options": [],
    "answer": "（1）5；（2）`2,3,4,5,6,7` 中任一整数",
    "core": -1
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
    "core": -1
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
    "core": -1
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
    "core": -1
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
    "core": -1
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
    "core": -1
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
    "core": -1
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
    "core": -1
  },
  {
    "id": "FUNC-SC-0193",
    "chapter": "对数与指数互化",
    "title": "常用对数",
    "type": "SC",
    "stem": "若lgx = 2，则x的值为：",
    "options": [
      {
        "label": "A",
        "text": "$2$"
      },
      {
        "label": "B",
        "text": "$100$"
      },
      {
        "label": "C",
        "text": "$0.01$"
      },
      {
        "label": "D",
        "text": "$e^{2}$"
      }
    ],
    "answer": "B",
    "core": 1
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
    "core": -1
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
    "core": -1
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
    "core": -1
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
    "core": -1
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
    "core": -1
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
    "core": -1
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
    "core": -1
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
    "core": -1
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
    "core": -1
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
    "core": -1
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
    "core": -1
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
    "core": -1
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
    "core": -1
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
    "core": -1
  }
];
// END REVIEWED CATALOG
const tasks = [
  ['二次方程的实根', '若关于 x 的一元二次方程 kx² − 2x + 1 = 0 有两个不相等的实根，求 k 的取值范围。'],
  ['对数与指数', '若 lg x = 2，则 x 的值为：A. 2　B. 100　C. 0.01　D. e²'],
  ['区间上的最值', '已知 a、b ∈ [0,2]，求 a² − a + |b − a| 的最大值。']
];
const taskChapters = ['函数基础与表示', '函数性质与变化', '指数与幂的运算', '对数与指数互化', '零点与方程', '函数最值与应用'];
const taskQuestions = [0, 1, 2].map(core => reviewedCatalog.find(item => item.core === core))
  .concat(taskChapters.flatMap(chapter => reviewedCatalog.filter(item => item.core < 0 && item.chapter === chapter)));
tasks.push(...taskQuestions.slice(3).map(item => [item.title, item.stem + (item.options.length ? '\n' + item.options.map(option => option.label + '. ' + option.text).join('\n') : '')]));
function assessTaskAnswer(value = state.answer) {
  const verified = LearningFlow.finalAssessment({ stem: tasks[state.task][1], question: value });
  if (verified !== 'unknown') return verified;
  if (state.task === 1) return LearningFlow.choiceAssessment(value);
  const item = taskQuestions[state.task];
  if (item.type !== 'SC') return 'unknown';
  const choice = String(value).normalize('NFKC').trim().match(/^(?:我)?(?:选择|选|答案是|答案为)?\s*([A-D])[。.!！\s]*$/i);
  const key = item.answer.match(/^([A-D])(?:$|[^A-Za-z])/) || item.answer.match(/选项\s*([A-D])/);
  if (!choice || !key) return 'unknown';
  return choice[1].toUpperCase() === key[1] ? 'correct' : 'incorrect';
}
function taskAnswerFeedback() {
  if (assessTaskAnswer() === 'correct') return '你做对了！这道题的引导结束，可以进入下一题。';
  if (state.task === 1) return LearningFlow.answerFeedback(state.answer);
  const assessment = assessTaskAnswer();
  return (assessment === 'correct' ? '这次选择正确。请继续说明你的依据。' : assessment === 'incorrect' ? '这次选择还不正确。请检查使用的条件和推导。' : taskQuestions[state.task].type === 'SC' ? '请填写一个选项字母，再提交核对。' : '思路已收到。我们一起检查推导和边界条件。') + ' ' + answerCheckSuggestion();
}
const filmingEntry = typeof location !== 'undefined' && location.pathname === '/baseline';
const storageKey = filmingEntry ? 'zhiban-filming-baseline-v1' : 'zh伴-desktop-v1';
const defaults = () => ({ active: false, paused: false, task: 0, answer: '', result: '',
  strategyStudy:false,studyEpoch:'',
  cognitiveSession: '', cognitiveAssistance: 'unknown', cognitiveSeen: [], cognitiveLast: '', cognitiveCoverage: false,
  record: false, proactive: false, profile: false, coverage: false, events: [], demoRecords: [], recordsSeeded: false, cooldownUntil: 0, tutor: LearningFlow.initial() });
let state = defaults(), storageNotice = '';
try {
  const raw = JSON.parse(localStorage.getItem(storageKey) || 'null');
  if (raw && raw.version === 1 && Number.isInteger(raw.task) && tasks[raw.task]) {
    for (const key of ['active', 'paused', 'record', 'proactive', 'profile', 'coverage','strategyStudy']) state[key] = raw[key] === true;
    state.studyEpoch=typeof raw.studyEpoch==='string'?raw.studyEpoch:'';
    state.task = raw.task; state.answer = String(raw.answer || '').slice(0, 2000);
    state.result = String(raw.result || '').slice(0, 500);
    state.tutor = LearningFlow.normalize(raw.tutor, { stem: tasks[raw.task][1] });
    state.cooldownUntil = Number.isFinite(raw.cooldownUntil) ? raw.cooldownUntil : 0;
    state.recordsSeeded = raw.recordsSeeded === true;
    state.recordsSupplemented = raw.recordsSupplemented === true;
    state.cognitiveSession = typeof raw.cognitiveSession === 'string' ? raw.cognitiveSession : '';
    state.cognitiveAssistance = ['independent', 'assisted', 'unknown'].includes(raw.cognitiveAssistance) ? raw.cognitiveAssistance : 'unknown';
    state.cognitiveSeen = Array.isArray(raw.cognitiveSeen) ? raw.cognitiveSeen.filter(Number.isInteger) : [];
    state.cognitiveLast = typeof raw.cognitiveLast === 'string' ? raw.cognitiveLast : '';
    state.cognitiveCoverage = raw.cognitiveCoverage === true && state.record && state.profile && !!state.cognitiveSession;
    state.demoRecords = Array.isArray(raw.demoRecords) ? raw.demoRecords.filter(r => r && typeof r.id === 'string' && ['study','emotion','habit','help','companion'].includes(r.category) && Number.isFinite(r.time)).slice(0,500) : [];
    state.events = Array.isArray(raw.events) ? raw.events.filter(e => e && typeof e.type === 'string' && Number.isFinite(e.time)).slice(-500).map((e,i) => ({...e, id: e.id || 'legacy-' + i + '-' + e.time})) : [];
    if (!Array.isArray(raw.cognitiveSeen)) state.cognitiveSeen = [...new Set(state.events.map(e => e.task).filter(Number.isInteger).concat(state.active ? [state.task] : []))];
  }
} catch (_) { storageNotice = '学习记录暂时无法读取，本次可以继续使用。'; }
let current = 'study', catalog = false, workVisible = false, visibleSince = Date.now(), lastActivity = Date.now();
const navigationHistory = [];
function navigationSnapshot() {
  return {section:workVisible ? (catalog?'catalog':current) : 'home',
    scroll:el('content').scrollTop || 0, recordFilter, recordPage};
}
function rememberPage() { navigationHistory.push(navigationSnapshot()); }
function goBack() {
  const previous = navigationHistory.pop();
  if (!previous || previous.section==='home') { showHome(); return; }
  recordFilter=previous.recordFilter; recordPage=previous.recordPage;
  recordSelection.clear(); recordPending=[]; recordMenu=''; recordSelecting=false;
  openWork(previous.section, false);
  el('content').scrollTop=previous.scroll;
}
let modal = false, offer = 'help', busy = false, engineReady = false, engineStatus = '正在准备离线学伴…';
let messages = [], chatInput = '', liveUser = '', liveAnswer = '', chatNotice = '', aborter = null;
let conversationRevision = 0, submissionHint = '', submissionPending = false;
// A continuation of the learner's current dialogue; never persisted or resumed after reload.
let boundaryHintWait = null;
let baselineStep = 'start';
async function baselineReply(question, timedHint = false) {
  const input = { stem: tasks[state.task][1], question, tutor: state.tutor };
  const route = LearningFlow.questionRoute(input);
  const stage = timedHint ? 'hint' : route === 'answer_request' ? 'refuse' : LearningFlow.finalAssessment(input) === 'correct' ? 'complete' :
    route === 'correct_quadratic_range' ? 'waiting' :
    /怎么想|怎么做|思路|如何|从哪|重新开始/.test(question) ? 'start' :
    baselineStep === 'waiting' && /思考|想想|想一想/.test(question) ? 'thinking' :
    route && route !== 'clarify' ? 'followup' : baselineStep === 'start' ? 'start' : 'followup';
  if (stage !== 'thinking') boundaryHintWait = null;
  if (typeof invalidateActive === 'function') invalidateActive('baseline_dialogue', true);
  const revision = conversationRevision;
  busy = true; liveUser = timedHint ? '' : question; liveAnswer = ''; chatInput = ''; chatNotice = '';
  const controller = new AbortController(); aborter = controller; updateChat();
  try {
    const response = await fetch('/api/baseline',{method:'POST',signal:controller.signal,headers:{'Content-Type':'application/json'},
      body:JSON.stringify({question,history:[],stage,task:state.task})});
    const result = await response.json();
    if (!response.ok || result.source !== 'local-model' || typeof result.content !== 'string') throw Error(result.error || '模型回复未完成，请重试。');
    if (revision !== conversationRevision || controller.signal.aborted) return;
    if (stage === 'complete') {
      completeCorrectAnswer(question, true);
      messages[messages.length-1].content = result.content;
      state.result = result.content;
    } else {
      state.tutor.phase = 'guide';
      messages = messages.concat(timedHint ? [] : [{role:'user',content:question}], [{role:'assistant',content:result.content}]).slice(-12);
    }
    baselineStep = stage === 'waiting' || stage === 'thinking' ? 'waiting' : stage === 'hint' ? 'hinted' : stage === 'complete' ? 'complete' : 'discriminant';
    if (stage === 'waiting') boundaryHintWait = {task:0,startedAt:Date.now()};
    submissionHint = result.content; state.cognitiveAssistance = 'assisted';
    if (timedHint) state.cooldownUntil = Math.max(state.cooldownUntil,Date.now()+300000);
    save();
  } catch (error) {
    if (revision === conversationRevision) { chatInput = timedHint ? '请给我刚才的提示' : question; chatNotice = controller.signal.aborted ? '回复已停止。' : error.message; }
  } finally {
    if (aborter === controller) {
      busy = false; aborter = null; liveUser = ''; touch(); updateChat();
      if (current === 'chat') el('chat-input').value = chatInput;
    }
  }
}
function restartFilming() {
  stopChat(); conversationRevision++; boundaryHintWait = null; baselineStep = 'start';
  messages = []; chatInput = ''; submissionHint = ''; submissionPending = false;
  state.answer = ''; state.result = ''; state.tutor = LearningFlow.initial();
  if (typeof invalidateActive === 'function') invalidateActive('baseline_restart', true);
  save(); openChat();
}
function scheduleBoundaryHint(guidance) {
  boundaryHintWait = guidance?.strategy === 'answer_correct_quadratic_range' && state.active && state.task === 0 ?
    { task: state.task, startedAt: Date.now() } : null;
}
function boundaryHintTick() {
  if (!boundaryHintWait) return false;
  if (!state.active || state.task !== boundaryHintWait.task || state.tutor.phase === 'complete' || state.paused) {
    boundaryHintWait = null; return false;
  }
  if (busy || modal || !workVisible || !['study', 'chat'].includes(current) || catalog || document.hidden || !document.hasFocus()) {
    boundaryHintWait.startedAt = Date.now(); return true;
  }
  if (Date.now() - Math.max(boundaryHintWait.startedAt, lastActivity, visibleSince) < 180000) return true;
  boundaryHintWait = null;
  showOffer('boundary');
  return true;
}
let growthIndex = 0;
let recordFilter = 'all', recordPage = 0, recordSelection = new Set(), recordPending = [], recordNotice = '';
let recordSelecting = false, recordMenu = '', recordPress = null;
function cancelRecordPress() {
  if (recordPress) clearTimeout(recordPress.timer);
  recordPress = null;
}
function beginRecordPress(e, key) {
  if (e.button !== 0 || recordSelecting || recordPending.length || e.target.closest('button')) return;
  cancelRecordPress();
  recordPress = { x: e.clientX, y: e.clientY, timer: setTimeout(() => {
    recordPress = null;
    if (current !== 'records') return;
    showRecordMenu(key);
  }, 550) };
}
function moveRecordPress(e) {
  if (recordPress && Math.hypot(e.clientX - recordPress.x, e.clientY - recordPress.y) > 8) cancelRecordPress();
}
function showRecordMenu(key) {
  cancelRecordPress(); recordMenu = key; renderLocalRecords(true);
  el('record-menu-delete').focus();
}
function closeRecordMenu() { recordMenu = ''; renderLocalRecords(true); }
function toggleRecordSelection() {
  recordSelecting = !recordSelecting; recordSelection.clear(); recordMenu = ''; recordPending = [];
  renderLocalRecords(true);
}
function activateRecord(e, key) {
  if (e.target.closest('button')) return;
  if (recordSelecting) selectLocalRecord(key, !recordSelection.has(key));
}
function recordKey(e, key) {
  if (e.target !== e.currentTarget) return;
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    if (recordSelecting) selectLocalRecord(key, !recordSelection.has(key)); else showRecordMenu(key);
  }
}
document.addEventListener('pointerup', cancelRecordPress);
document.addEventListener('pointercancel', cancelRecordPress);
document.addEventListener('scroll', cancelRecordPress, true);
window.addEventListener('blur', cancelRecordPress);
document.addEventListener('keydown', e => {
  if (current !== 'records' || e.key !== 'Escape') return;
  cancelRecordPress();
  if (recordPending.length) cancelDeleteLocalRecords();
  else if (recordMenu) closeRecordMenu();
  else if (recordSelecting) toggleRecordSelection();
});

function makeDemoRecords() {
  const result = [];
  const learning = ['阅读题干并标出已知条件，暂未提交答案。', '独立尝试后查看参考答案，准备核对推导过程。', '检查定义与取值限制，补充了一个遗漏的条件。', '重新整理运算步骤，保留待核对的问题。'];
  const feelings = [
    ['专注', '持续尝试并检查步骤，可能处于专注状态；仅为行为假设，待本人确认。'],
    ['迟疑', '在两种解法间停顿后请求提示，可能仍在权衡思路；不能仅凭停顿确定情绪。'],
    ['烦躁', '学生自报：“有点烦躁，想先缓一缓。”学伴提供暂停选项。'],
    ['顿悟', '多次尝试后找到解题线索，可能有豁然开朗的感受；尚未确认。'],
    ['释然', '借助提示完成当前步骤，可能感到释然；不等同于已经掌握。'],
    ['疲惫', '学生自报：“有点累。”选择短暂休息，暂不继续追问。'],
    ['状态不错', '学生自报：“状态不错。”继续按原来的节奏学习。'],
    ['气馁', '反复尝试仍未推进，可能感到气馁；也可能只是题目难度较高。'],
    ['困惑', '多次请求解释同一概念，可能仍有困惑；学伴改用具体例子。']
  ];
  const habits = [
    ['先尝试，再求助', '先写下思路再请求提示。可作为自主尝试的观察，不能据此认定稳定习惯。'],
    ['暂停后继续', '主动休息后回到同一道题。记录一次恢复学习的行为。'],
    ['检查边界条件', '对照题干重新检查定义域与限制条件。建议保留这一检查步骤。'],
    ['反复核对', '在同一步骤重复检查。可能在认真验证，也可能卡住，需进一步确认。'],
    ['换一种方法', '原思路停滞后尝试换一个角度。记录策略切换，不评分人格。'],
    ['整理错误原因', '对照参考答案后补写原因。一次复盘不等同于长期掌握。'],
    ['分步推进', '把问题拆成两个小步骤后继续。可尝试在类似题中复用。'],
    ['表达推导依据', '在结论之后补充理由。建议继续解释每一步为何成立。'],
    ['保持自己的节奏', '选择稍后查看帮助，继续独立尝试。尊重本次选择，不推断固定偏好。']
  ];
  for (let i = 0; i < 102; i++) {
    const category = i < 48 ? 'study' : i < 75 ? 'emotion' : 'habit';
    const question = reviewedCatalog[i % reviewedCatalog.length];
    const sample = category === 'emotion' ? feelings[(i - 48) % feelings.length] : category === 'habit' ? habits[(i - 75) % habits.length] : null;
    result.push({ id: 'demo-' + String(i + 1).padStart(3, '0'), category,
      time: new Date(2026, 8, 10 + Math.floor(i / 6), 18, (i % 6) * 9).getTime(),
      title: sample ? sample[0] : '学习 · ' + question.chapter,
      detail: sample ? sample[1] : learning[i % learning.length],
      question: question.title, questionId: question.id });
  }
  return enrichKnowledgeRecords(result);
}
function enrichKnowledgeRecords(records) {
  const skills = [
    ['quadratic_definition','二次项系数与退化',2,['能写出二次项系数不为零','漏检系数为零时的退化情况','提示后区分一次与二次方程','独立核对系数并修正边界']],
    ['discriminant','判别式与实根',3,['正确列出判别式并计算','把两个不等实根误写成判别式大于等于零','复习后能区分相等与不等实根','独立说明判别式为正的含义']],
    ['joint_conditions','条件交集与边界',2,['列出系数和判别式两项条件','求交集时忘记排除一个端点','提示后补上退化条件','独立检查最终区间的端点']],
    ['log_exponent','对数定义与指数互化',3,['正确把常用对数写成以十为底的指数式','混淆底数与真数的位置','借助具体例子完成指数互化','独立求值并检查真数为正']],
    ['absolute_distance','绝对值距离与端点',3,['用数轴解释绝对值距离','端点代入时发生符号错误','分步核对两个端点的距离','独立比较端点并说明理由']],
    ['piecewise_extrema','分段与区间最值',2,['找出绝对值表达式的分界点','分段时漏掉等号归属','提示后补齐各段取值范围','独立列出各段需要比较的候选点']],
    ['attainable_maximum','候选比较与可达性',2,['列出端点和分界点候选值','把不能取到的上界当成最大值','核对开闭区间后修正结论','独立比较候选值并确认可以取到']]
  ];
  const counts = [4,5,3,11,5,3,4];
  const attempts = counts.flatMap((count,skillIndex)=>Array.from({length:count},(_,attempt)=>({skillIndex,attempt,count})));
  return records.map(r=> {
    const n = Number(r.id.replace('demo-','')) - 1;
    if (!/^demo-\d+$/.test(r.id) || n<0 || n>=attempts.length || r.category!=='study') return r;
    const {skillIndex,attempt,count} = attempts[n], skill=skills[skillIndex], phase=attempt%4;
    const correct = phase===0 || phase===3 || (phase===2 && skill[2]===3);
    return {...r, time:new Date(2026,8,7+Math.floor(attempt*20/(count-1))+skillIndex%2,15+attempt%3,(n*11)%60).getTime(), title:skill[1]+' · '+['初次尝试','错因回顾','提示后练习','独立复习','变式练习','隔日回顾','口头解释','迁移尝试','错题重做','条件核查','阶段复习'][attempt],
      detail:skill[3][phase]+'。'+(attempt>=4?['换一道同类题重新尝试。','回顾前次错因后再核对。','补写关键步骤的理由。'][attempt%3]:'')+(correct?'本次步骤核对正确。':'仍需继续检查，保留了待复习的问题。'),
      question:skillIndex<3?'二次方程的实根':skillIndex===3?'对数与指数':'区间上的最值',
      questionId:skillIndex<3?'FUNC-FB-0032':skillIndex===3?'FUNC-SC-0193':'FUNC-SA-0139',
      knowledge:{skillId:skill[0],outcome:correct?'correct':'incorrect',assistance:phase===2?'assisted':'independent',source:'authored_sample'}};
  });
}
function persistRecordChange(next) {
  if (typeof pruneActiveDependencies === 'function') next = pruneActiveDependencies(next, state);
  try { localStorage.setItem(storageKey, JSON.stringify({ ...next, version: 1 })); state = next; return true; }
  catch (_) { recordNotice = '保存失败，记录未删除。请检查浏览器存储空间后重试。'; return false; }
}
function makeStudentSupportRecords() {
  const methods = ['分步提示', '概念核查', '具体例子', '反问引导', '自主尝试后复盘', '短暂休息'];
  const outcomes = ['独立后测答对，仍需复习迁移条件', '后测答错，遗漏了定义域限制', '后测部分步骤正确，运算符号出错', '选择跳过后测，不计为失败', '后测待完成，结果未知', '使用额外提示后完成，不算独立掌握'];
  const expressions = ['这道题有点难，我想先缓一缓', '我算出了结果，但不确定理由', '今天状态不错，想再试一道题', '有点累了，准备休息五分钟', '刚才没听懂，能换个例子吗', '我想自己再试试，暂时不用提示', '这一步终于想明白了', '不想做了，先陪我整理一下思路'];
  const responses = ['接受分步提示，重新写出第一步', '选择稍后再说，继续独立尝试', '接受休息建议，五分钟后恢复', '拒绝帮助，保留自己的解题节奏', '请求一个具体例子，再回到原题', '交流结束，是否解决仍未知'];
  return ['help','companion'].flatMap((category,c) => Array.from({length:24}, (_,i) => {
    const q = reviewedCatalog[(i * 7 + c) % reviewedCatalog.length];
    return {id: 'student-' + category + '-' + String(i+1).padStart(3,'0'), category,
      time: new Date(2026,8,7+i%24,14+(i%6), (i*13)%60).getTime(),
      title: category === 'help' ? methods[i%methods.length] + ' · ' + q.chapter : '学伴陪伴 · ' + responses[(i+Math.floor(i/6))%responses.length].split('，')[0],
      detail: category === 'help' ? '先独立尝试，' + (i%3 === 0 ? '基础概念基本理解，迁移时犹豫。' : i%3 === 1 ? '漏掉一个条件，请求帮助。' : '计算过程需要核对。') + '帮助方式：' + methods[i%methods.length] + '；' + outcomes[(i+Math.floor(i/6))%outcomes.length] + '。'
        : '学生说：“' + expressions[i%expressions.length] + '”。学伴提供可选择的支持；学生' + responses[(i+Math.floor(i/6))%responses.length] + '。',
      question: q.title, questionId:q.id};
  }));
}
function restoreStudentDemoRecords() {
  const existing = new Set(state.demoRecords.map(r=>r.id));
  const additions = makeDemoRecords().concat(makeStudentSupportRecords()).filter(r=>!existing.has(r.id));
  const supportById = new Map(makeStudentSupportRecords().map(r=>[r.id,r]));
  if (persistRecordChange({...state, recordsSeeded:true, recordsSupplemented:true, demoRecords:state.demoRecords.map(r=>supportById.get(r.id)||r).concat(additions)})) {
    recordNotice = '已补充 ' + additions.length + ' 条记录；已有记录保持保留。';
  }
  renderLocalRecords();
}
function recordCategoryPanel(category, title) {
  const rows = localRecordRows().filter(r=>r.category===category);
  return '<div class="panel"><h2>' + esc(title) + '</h2><p class="muted">当前保留 ' + rows.length + ' 条。</p>' +
    rows.slice(0,3).map(r=>'<p><small>' + esc(new Date(r.time).toLocaleString('zh-CN')) + '</small><br>' + esc(r.detail) + '</p>').join('') +
    '<button class="secondary" onclick="openLocalRecords(\''+category+'\')">查看或删除'+esc(title)+'</button></div>';
}
function openLocalRecords(category = 'all') {
  rememberPage();
  recordSelecting = false; recordMenu = ''; cancelRecordPress();
  recordSelection.clear(); recordPending = []; recordPage = 0; recordFilter = category; recordNotice = '';
  if (!state.recordsSeeded && !persistRecordChange({ ...state, recordsSeeded: true, demoRecords: makeDemoRecords() })) {
    recordNotice = '演示记录未能保存，请检查浏览器存储空间后重新进入。';
  }
  tab('records', false);
}
function localRecordRows() {
  const names = { causal_practice: '帮助与后测记录', started: '开始学习', finished: '结束学习', paused: '暂停学习', resumed: '恢复学习', feeling: '自报感受', answer_correct: '选择题答对', answer_submitted: '提交作答', offer: '学伴主动询问', offer_response: '回应学伴建议', chat_completed: '完成一轮交流' };
  const values = { rest: '建议休息', help: '提供帮助', accepted: '接受', declined: '不需要', later: '稍后', hint: '请求提示', split: '拆成步骤' };
  return state.demoRecords.map(r => ({ ...r, key: r.id, demo: true })).concat(state.events.map(e => ({
    key: 'real-' + e.id, demo: false, time: e.time,
    category: e.type === 'feeling' ? 'emotion' : ['paused','resumed'].includes(e.type) ? 'habit' : e.type === 'causal_practice' ? 'help' : ['offer','offer_response','chat_completed'].includes(e.type) ? 'companion' : 'study',
    title: e.type === 'cognitive_observation' ? '知识理解观察' : names[e.type] || '学习交互 · ' + e.type,
    detail: e.value ? (values[e.value] || String(e.value)) : '应用内学习行为记录。',
    question: tasks[e.task] ? tasks[e.task][0] : '学习空间', questionId: ''
  }))).sort((a,b) => b.time - a.time || a.key.localeCompare(b.key));
}
function filteredRecordRows() { return localRecordRows().filter(r => recordFilter === 'all' || r.category === recordFilter); }
function filterLocalRecords(value) {
  if (!['all','study','emotion','habit','help','companion'].includes(value)) return;
  recordFilter = value; recordPage = 0; recordSelection.clear(); recordPending = []; recordMenu = ''; renderLocalRecords();
}
function selectLocalRecord(key, checked) {
  if (checked) recordSelection.add(key); else recordSelection.delete(key);
  renderLocalRecords(true);
}
function selectAllLocalRecords(checked) {
  recordSelection = checked ? new Set(filteredRecordRows().map(r => r.key)) : new Set(); renderLocalRecords(true);
}
function pageLocalRecords(delta) { recordPage += delta; recordMenu = ''; renderLocalRecords(); }
function askDeleteLocalRecords(key) {
  recordMenu = '';
  recordPending = key ? [key] : [...recordSelection];
  const existing = new Set(localRecordRows().map(r => r.key));
  recordPending = recordPending.filter(k => existing.has(k)); renderLocalRecords();
  if (recordPending.length) el('record-confirm').focus();
}
function cancelDeleteLocalRecords() { recordPending = []; renderLocalRecords(); }
function deleteLocalRecords() {
  if (!recordPending.length) return;
  const ids = new Set(recordPending);
  const next = { ...state, demoRecords: state.demoRecords.filter(r => !ids.has(r.id)), events: state.events.filter(e => !ids.has('real-' + e.id)) };
  if (persistRecordChange(next)) {
    recordNotice = '已删除 ' + recordPending.length + ' 条记录。';
    recordPending.forEach(k => recordSelection.delete(k)); recordPending = [];
  }
  renderLocalRecords();
}
function renderLocalRecords(keepScroll = false) {
  cancelRecordPress();
  const root = el('content'), scroll = root.scrollTop;
  const rows = filteredRecordRows();
  const pageCount = Math.max(1, Math.ceil(rows.length / 20));
  recordPage = Math.min(Math.max(0, recordPage), pageCount - 1);
  const selected = rows.filter(r => recordSelection.has(r.key)).length;
  const allSelected = rows.length > 0 && selected === rows.length;
  const labels = { study: '学习记录', emotion: '情绪记录', habit: '学习习惯与态度', help:'帮助与后测记录', companion:'学伴陪伴记录' };
  root.innerHTML = `<button class="growth-back" onclick="goBack()">‹ 返回上一页</button>
    <div class="record-heading"><h1>本机记录</h1><button class="record-action" aria-pressed="${recordSelecting}" onclick="toggleRecordSelection()">${recordSelecting ? '完成' : '选择'}</button></div>
    <p class="intro">把每一步留下，由你决定保留，只在当前设备离线保存。</p>
    <div class="record-filters">${['all','study','emotion','habit','help','companion'].map(k => `<button class="secondary" aria-pressed="${recordFilter === k}" onclick="filterLocalRecords('${k}')">${labels[k] || '全部'}</button>`).join('')}</div>
    <details><summary>补充本机记录</summary><p class="muted">补回学习、情绪、习惯、帮助与后测和陪伴记录。已有记录保留；删除的补充记录只有点击此按钮才会重新加入。</p><button class="secondary" onclick="restoreStudentDemoRecords()">补充本机记录</button></details>
    ${recordSelecting ? `<div class="record-toolbar"><button class="record-action" ${!rows.length ? 'disabled' : ''} onclick="selectAllLocalRecords(${!allSelected})">${allSelected ? '取消全选' : '全选'}</button><span role="status">已选 ${selected} 条</span><button class="record-delete" ${!selected ? 'disabled' : ''} onclick="askDeleteLocalRecords()">删除</button></div>` : ''}
    ${recordNotice ? '<p role="status" class="muted">' + esc(recordNotice) + '</p>' : ''}
    <div class="record-list">${rows.slice(recordPage * 20, recordPage * 20 + 20).map(r => {
      const key = "decodeURIComponent('" + encodeURIComponent(r.key).replace(/'/g, '%27') + "')";
      return `<article class="record-row" data-selected="${recordSelecting && recordSelection.has(r.key)}" tabindex="0" ${recordSelecting ? 'role="checkbox" aria-checked="' + recordSelection.has(r.key) + '"' : 'aria-haspopup="menu"'} aria-label="${esc(r.title)}" onpointerdown="beginRecordPress(event,${key})" onpointermove="moveRecordPress(event)" onpointerleave="cancelRecordPress()" onclick="activateRecord(event,${key})" onkeydown="recordKey(event,${key})" oncontextmenu="event.preventDefault();if(!recordSelecting)showRecordMenu(${key})">
      ${recordSelecting ? '<span class="record-check" aria-hidden="true">' + (recordSelection.has(r.key) ? '✓' : '') + '</span>' : ''}
      <div><div class="record-meta">${labels[r.category]} · ${esc(new Date(r.time).toLocaleString('zh-CN', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' }))}</div><h2>${esc(r.title)}</h2><p>${esc(r.detail)}</p><small>${esc(r.question)}</small></div></article>`;
    }).join('')}</div>
    ${!rows.length ? '<p class="record-empty">暂无记录</p>' : ''}
    ${pageCount > 1 ? `<div class="record-pagination"><button class="secondary" ${recordPage === 0 ? 'disabled' : ''} onclick="pageLocalRecords(-1)">上一页</button><span>${recordPage + 1} / ${pageCount}</span><button class="secondary" ${recordPage >= pageCount - 1 ? 'disabled' : ''} onclick="pageLocalRecords(1)">下一页</button></div>` : ''}
    ${recordMenu ? `<div class="record-overlay" onclick="closeRecordMenu()"><div class="record-sheet" role="menu" aria-label="记录操作" onclick="event.stopPropagation()"><button id="record-menu-delete" role="menuitem" class="record-delete" onclick="askDeleteLocalRecords(decodeURIComponent('${encodeURIComponent(recordMenu).replace(/'/g, '%27')}'))">删除记录</button><button class="record-action" role="menuitem" onclick="closeRecordMenu()">取消</button></div></div>` : ''}
    ${recordPending.length ? `<div class="record-overlay"><section class="record-sheet" role="alertdialog" aria-modal="true" aria-labelledby="record-delete-title" onkeydown="if(event.key==='Tab'){event.preventDefault();document.getElementById(document.activeElement.id==='record-confirm'?'record-cancel':'record-confirm').focus()}"><h2 id="record-delete-title">删除${recordPending.length === 1 ? '这条' : '这 ' + recordPending.length + ' 条'}记录？</h2><p>删除后无法恢复。</p><div class="actions"><button id="record-cancel" class="secondary" onclick="cancelDeleteLocalRecords()">取消</button><button id="record-confirm" class="danger" onclick="deleteLocalRecords()">删除</button></div></section></div>` : ''}`;
  root.scrollTop = keepScroll ? scroll : 0;
}
const growthFrames = new Map();
// Deliberately fictional preview data; never written into personal learning events or profiles.
const growthPreview = [
  { title: '知识掌握', subtitle: '基础逐渐扎实，迁移还需要练习', color: '#507eae',
    labels: ['概念理解', '基础运算', '逻辑推理', '知识迁移', '表达说明', '纠错反思'],
    before: [58, 66, 52, 43, 48, 51], now: [70, 76, 64, 55, 61, 67],
    note: '熟悉的题型比较有把握，换一种问法时还会犹豫。开始愿意讲出理由，也能发现部分计算失误。',
    next: '每天挑一道做过的题，用自己的话讲清“为什么这样做”。' },
  { title: '情绪与学习态度', subtitle: '愿意尝试，也在练习接纳不顺利', color: '#9a6c9e',
    labels: ['情绪觉察', '情绪调节', '学习信心', '好奇探索', '主动求助', '受挫恢复'],
    before: [59, 48, 55, 63, 46, 47], now: [72, 61, 65, 73, 64, 60],
    note: '遇到难题偶尔着急，但通常能在提示后继续。对新知识有好奇心，正逐步把“我不会”变成具体的问题。',
    next: '卡住时先说清哪里不懂；感到烦躁时允许自己短暂休息。' },
  { title: '学习习惯与态度', subtitle: '节奏渐渐稳定，尝试与坚持也在生长', color: '#398879',
    labels: ['专注投入', '计划执行', '自主尝试', '及时复习', '错题整理', '学习坚持'],
    before: [55, 49, 59, 44, 42, 62], now: [67, 60, 72, 56, 58, 69],
    note: '多数时候会先独立尝试，再向学伴求助。遇到困难愿意继续尝试，暂停后也能重新投入；复习与错题整理还需要逐步积累。',
    next: '每次学习结束花几分钟，记下一个收获和一个待解决的问题。' }
];
function growthPoint(index, radius) {
  const angle = (index * 60 - 90) * Math.PI / 180;
  return [Math.cos(angle) * radius, Math.sin(angle) * radius];
}
function growthPolygon(values) {
  return values.map((value, i) => growthPoint(i, value * .88).map(n => n.toFixed(2)).join(',')).join(' ');
}
function growthRadar(item, index) {
  const grid = [20, 40, 60, 80, 100].map(value => '<polygon points="' + growthPolygon(Array(6).fill(value)) + '"/>').join('');
  const axes = item.labels.map((_, i) => { const p = growthPoint(i, 88); return '<line x1="0" y1="0" x2="' + p[0] + '" y2="' + p[1] + '"/>'; }).join('');
  const labels = item.labels.map((label, i) => {
    const p = growthPoint(i, 119);
    return '<text x="' + p[0] + '" y="' + (p[1] - 2) + '" text-anchor="middle">' + label +
      '<tspan x="' + p[0] + '" dy="16" class="radar-score">' + item.now[i] + '</tspan></text>';
  }).join('');
  return '<section class="growth-radar-card" style="--radar-color:' + item.color + '">' +
    '<div class="growth-card-heading"><span class="growth-card-number">0' + (index + 1) + '</span><div><h2>' + item.title + '</h2><p>' + item.subtitle + '</p></div></div>' +
    '<svg class="growth-radar" viewBox="-170 -145 340 290" role="img" aria-labelledby="radar-title-' + index + ' radar-desc-' + index + '">' +
    '<title id="radar-title-' + index + '">' + item.title + '六维示例图</title><desc id="radar-desc-' + index + '">虚构学生，第1周与第4周对比。' + item.labels.map((label, i) => label + '：' + item.before[i] + '至' + item.now[i]).join('；') + '</desc>' +
    '<g class="radar-grid">' + grid + axes + '</g><polygon class="radar-before" points="' + growthPolygon(item.before) + '"/>' +
    '<g class="radar-folds" aria-hidden="true">' + item.now.map(() => '<polygon points="0,0 0,0 0,0"/>').join('') + '</g>' +
    '<g class="radar-expansion"><polygon class="radar-area" points="' + growthPolygon(item.now) + '"/>' +
    item.now.map((value, i) => { const p = growthPoint(i, value * .88); return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3"/>'; }).join('') + '</g>' +
    '<g class="radar-labels">' + labels + '</g><circle r="2.5" fill="#b2b0a5"/></svg>' +
    '<p class="growth-observation">' + item.note + '</p><div class="growth-next"><span>下一小步</span><p>' + item.next + '</p></div>' +
    '<details class="growth-values"><summary>查看六维数值</summary><table><caption>' + item.title + ' · 示例评分（0–100）</caption><thead><tr><th>维度</th><th>第1周</th><th>第4周</th></tr></thead><tbody>' +
    item.labels.map((label, i) => '<tr><th scope="row">' + label + '</th><td>' + item.before[i] + '</td><td>' + item.now[i] + '</td></tr>').join('') + '</tbody></table></details></section>';
}
function animateGrowth() {
  const track = el('growth-track');
  const cards = [...track.children];
  const update = () => {
    const index = Math.round(track.scrollLeft / track.clientWidth);
    growthIndex = Math.max(0, Math.min(cards.length - 1, index));
    track.closest('.growth-page').style.setProperty('--active-radar-color', growthPreview[growthIndex].color);
    document.querySelectorAll('.growth-page-tab').forEach((button, i) => button.setAttribute('aria-pressed', String(i === growthIndex)));
    el('growth-position').textContent = (growthIndex + 1) + ' / 3 · 左右滑动查看';
    el('growth-prev').disabled = growthIndex === 0;
    el('growth-next').disabled = growthIndex === cards.length - 1;
    cards.forEach((card, i) => {
      card.inert = i !== growthIndex;
      if (i !== growthIndex) card.querySelector('details').open = false;
    });
    // Wait until the page has settled so the unfold is visible in its entirety.
    if (Math.abs(track.scrollLeft - growthIndex * track.clientWidth) < 2) unfoldGrowth(cards[growthIndex], growthIndex);
  };
  track.addEventListener('scroll', update, { passive: true });
  track.addEventListener('keydown', e => {
    if (e.target !== track || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault(); selectGrowth(growthIndex + (e.key === 'ArrowRight' ? 1 : -1));
  });
  track.scrollLeft = growthIndex * track.clientWidth;
  update();
}
function selectGrowth(index) {
  const track = el('growth-track');
  const next = Math.max(0, Math.min(growthPreview.length - 1, index));
  track.scrollTo({ left: next * track.clientWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
}
function unfoldGrowth(card, index, replay = false) {
  if (card.classList.contains('revealed') && !replay) return;
  cancelAnimationFrame(growthFrames.get(card));
  card.classList.add('revealed'); card.classList.remove('unfolded');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { card.classList.add('unfolded'); return; }
  const faces = [...card.querySelectorAll('.radar-folds polygon')];
  const values = growthPreview[index].now;
  const start = performance.now();
  function frame(now) {
    faces.forEach((face, i) => {
      const progress = Math.max(0, Math.min(1, (now - start - i * 65) / 950));
      const opened = 1 - Math.pow(1 - progress, 3);
      const angle = (i * 60 - 60) * Math.PI / 180;
      // Each triangular paper face opens about its radial crease at SVG (0, 0).
      // Project the fold onto that axis; neither the grid nor the center moves.
      const project = j => {
        const p = growthPoint(j, values[j] * .88);
        const radial = p[0] * Math.cos(angle) + p[1] * Math.sin(angle);
        const tangent = -p[0] * Math.sin(angle) + p[1] * Math.cos(angle);
        const reach = .025 + .975 * opened;
        const spread = Math.sin(opened * Math.PI / 2);
        return [(radial * Math.cos(angle) - tangent * Math.sin(angle) * spread) * reach,
          (radial * Math.sin(angle) + tangent * Math.cos(angle) * spread) * reach].join(',');
      };
      face.setAttribute('points', '0,0 ' + project(i) + ' ' + project((i + 1) % 6));
      face.style.fillOpacity = String(.18 + (1 - opened) * (i % 2 ? .3 : .12));
    });
    if (now - start < 1275 && card.isConnected) growthFrames.set(card, requestAnimationFrame(frame));
    else { card.classList.add('unfolded'); growthFrames.delete(card); }
  }
  frame(start);
}
function replayGrowth() {
  unfoldGrowth(el('growth-track').children[growthIndex], growthIndex, true);
}
function renderGrowthTrajectory() {
  el('content').innerHTML = '<div class="growth-page"><button class="growth-back" onclick="goBack()">‹ 返回上一页</button>' +
    '<div class="growth-hero"><h1>成长轨迹</h1><p>慢慢展开，就是成长的样子。</p>' +
    '<div class="growth-demo-badge">示例画像 · 非个人评估</div></div>' +
    '<p class="growth-demo-note">虚构学生的四周成长示例，非真实记录，不用于诊断或排名。</p>' +
    '<div class="growth-page-tabs" aria-label="选择画像维度">' + ['知识掌握', '情绪与态度', '学习习惯与态度'].map((title, i) => '<button class="growth-page-tab" aria-pressed="false" onclick="selectGrowth(' + i + ')">' + title + '</button>').join('') + '</div>' +
    '<div class="growth-legend"><span><i class="legend-dashed"></i>第1周</span><span><i class="legend-solid"></i>第4周</span><button onclick="replayGrowth()">重播展开 ↻</button></div>' +
    '<div id="growth-track" class="growth-track" tabindex="0" role="region" aria-label="三维成长画像，使用左右方向键切换">' + growthPreview.map(growthRadar).join('') + '</div>' +
    '<div class="growth-pagination"><button id="growth-prev" aria-label="上一幅图" onclick="selectGrowth(growthIndex-1)">‹</button><span id="growth-position" aria-live="polite"></span><button id="growth-next" aria-label="下一幅图" onclick="selectGrowth(growthIndex+1)">›</button></div></div>';
  el('content').scrollTop = 0; animateGrowth();
}
const el = id => document.getElementById(id);
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function save() {
  if (typeof activeRetainedEvents === 'function') state.events = activeRetainedEvents(state.events);
  else state.events=state.events.slice(-500);
  try { localStorage.setItem(storageKey, JSON.stringify({ ...state, version: 1 })); }
  catch (_) { storageNotice = '本机记录保存失败，请检查浏览器存储空间。'; }
}
function event(type, value = '') {
  if (state.record) { state.events.push({ id: Date.now().toString(36) + '-' + Math.random().toString(36).slice(2), type, value, task: state.task, time: Date.now(),
    profileConsent: state.profile, coverageComplete: state.cognitiveCoverage, sessionId: state.cognitiveSession }); }
  save();
}
function cognitiveBelief() {
  if (typeof CognitiveState === 'undefined') return null;
  const evidence = [], byId = new Map(), rejected = new Set();
  for (const record of state.events.filter(e => e.cognitive)) {
    try {
      const e = CognitiveState.validate(record.cognitive);
      if (byId.has(e.id) && JSON.stringify(byId.get(e.id)) !== JSON.stringify(e)) rejected.add(e.id);
      byId.set(e.id, e);
    } catch (_) { rejected.add(record.id); }
  }
  for (const [id, e] of byId) if (!rejected.has(id)) evidence.push(e);
  try { return { ...CognitiveState.replay(evidence), rejectedCount: rejected.size }; } catch (_) { return null; }
}
function cognitiveRecord(kind, input, evaluation) {
  if (typeof CognitiveState === 'undefined' || !state.active || state.task > 2 || !state.record || !state.profile || !state.cognitiveCoverage || !state.cognitiveSession) return;
  const topic = CognitiveState.topics[state.task];
  const text = kind === 'answer' ? state.answer : input.question;
  const step = kind === 'answer' ? topic.skills.length - 1 : Math.min(topic.skills.length - 1, input.tutor?.step || 0);
  // An unchanged submission/retry is one attempt; assistance metadata does not turn it into another observation.
  // A retry fingerprint avoids retaining another copy of the student's text.
  const keyText = JSON.stringify([state.cognitiveSession, kind, step, text]);
  let hash = 2166136261;
  for (let i = 0; i < keyText.length; i++) hash = Math.imul(hash ^ keyText.charCodeAt(i), 16777619);
  const key = keyText.length + ':' + (hash >>> 0).toString(16);
  if (state.cognitiveLast === key) return;
  state.cognitiveLast = key;
  const id = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
  const e = { schemaVersion: 1, id, studentId: 'local', sessionId: state.cognitiveSession, attemptId: id,
    time: Date.now(), origin: 'real', topic: topic.id, itemId: topic.itemId, skillId: topic.skills[step], kind,
    outcome: kind === 'answer' ? CognitiveState.assess(state.task, text) : 'unknown',
    assistance: state.cognitiveAssistance, source: kind === 'answer' ? 'answer_key' : 'uncalibrated_explanation',
    conflict: evaluation?.verdict === 'incorrect' ? 'candidate' : 'none', consent: true,
    missingEvidence: kind === 'answer' ? ['independent_transfer', 'verified_explanation'] : ['calibrated_or_reviewed_explanation'],
    candidateVerdict: evaluation?.verdict || 'unknown' };
  // Attach to the existing removable record stream. No separate cache can resurrect deleted evidence.
  state.events.push({ id, type: 'cognitive_observation', value: CognitiveState.labels[e.skillId], task: state.task, time: e.time, cognitive: e });
  save();
}
function retractCognitive(id) {
  const next = { ...state, events: state.events.map(e => e.id === id && e.cognitive ? { ...e, cognitive: {
    ...e.cognitive, outcome: 'unknown', conflict: 'none', source: 'user_correction', revision: (e.cognitive.revision || 0) + 1 } } : e) };
  if (persistRecordChange(next)) render();
}
function renderCognitive() {
  if (!state.profile && !state.demoRecords.some(r=>r.knowledge)) return '<p>开启成长记录后，可查看三个经典例题的知识观察。</p>';
  const belief = cognitiveBelief();
  if (!belief) return '<p>' + (typeof CognitiveState === 'undefined' ? '知识计算模块未加载。请用“关闭学伴”关闭旧服务，再用项目启动器打开并刷新本页。学习记录会保留。' : '知识计算未完成。请在记录管理中核对异常记录，原始记录已保留。') + '</p>';
  const studyRecords = state.demoRecords.filter(r=>r.knowledge);
  return '<p class="muted">结合学习尝试、错因回顾与复习表现，找到下一步需要巩固的地方。</p>' + CognitiveState.topics.map(topic =>
    '<details><summary>' + esc(topic.title) + '</summary>' + topic.skills.map(id => {
      const s = belief.states[id], last = s.trace.at(-1);
      const history = studyRecords.filter(r=>r.knowledge.skillId===id).sort((a,b)=>a.time-b.time);
      const correct = history.filter(r=>r.knowledge.outcome==='correct').length;
      const summary = correct/history.length>=.7?'基本理解，继续巩固迁移':correct/history.length>=.45?'有所进步，仍需检查边界':'正在建立理解，建议分步复习';
      return '<p><strong>' + esc(s.label) + '</strong> · ' + (s.mastery === null ? history.length ? summary+' · '+history.length+' 次学习记录' : '待了解' : '掌握后验 ' + Math.round(s.mastery * 100) + '% · ' + s.observations + ' 次可用观察') + '</p>' +
        (s.mastery===null && history.length ? '<details><summary>查看学习过程</summary>'+history.map(r=>'<p><small>'+esc(new Date(r.time).toLocaleString('zh-CN'))+'</small><br>'+esc(r.detail)+'</p>').join('')+'<button class="secondary" onclick="openLocalRecords(\'study\')">查看或删除学习记录</button></details>':'') +
        (last ? '<details><summary>查看计算依据</summary><p>更新前 ' + last.prior.toFixed(3) + ' → 更新后 ' + last.posterior.toFixed(3) +
          '；' + (last.assistance === 'assisted' ? '已接受帮助' : '独立作答') + '。下一次独立答对预测 ' + s.nextIndependentCorrect.toFixed(3) +
          '。</p><p>证据：' + esc(s.evidenceIds.join('、')) + '</p><button class="secondary" onclick="retractCognitive(\'' + esc(last.evidenceId) + '\')">纠正：这条判断不准确</button></details>' : '');
    }).join('') + '</details>').join('') +
    (belief.currentCandidates.length ? '<p>近期解释存在待核查线索，需要进一步确认，尚未当作确定的概念错误。</p>' : '') +
    (belief.rejectedCount ? '<p>有 ' + belief.rejectedCount + ' 条格式异常或编号冲突的记录未参与计算，其他有效记录正常显示。原记录保留，可在记录管理中删除。</p>' : '') +
    (belief.ignored.length ? '<p class="muted">'+belief.ignored.length+' 条观察仍待核查，暂未用于更新。</p>':'');
}
function habitSummary(now = Date.now()) {
  const since = now - 30 * 86400000, byId = new Map(), conflicts = new Set();
  for (const e of state.events) {
    if (!e.id || !Number.isFinite(e.time) || e.time < since || e.time > now || e.cognitive) continue;
    if (byId.has(e.id) && JSON.stringify(byId.get(e.id)) !== JSON.stringify(e)) conflicts.add(e.id);
    byId.set(e.id, e);
  }
  const recent = [...byId.values()].filter(e => !conflicts.has(e.id));
  const events = state.profile ? recent.filter(e => e.profileConsent === true && e.coverageComplete === true && typeof e.sessionId === 'string' && e.sessionId) : [];
  const started = new Set(), ended = new Set(), paused = new Set(), days = new Set(), evidenceIds = [];
  const result = { sessions: 0, ended: 0, days: 0, submissions: 0, hints: 0, splits: 0, pauses: 0, returns: 0,
    excluded: recent.length - events.length + conflicts.size, evidenceIds, since, until: now };
  for (const e of events.sort((a,b) => a.time - b.time)) {
    if (e.type === 'started') started.add(e.sessionId);
    else if (e.type === 'finished' && started.has(e.sessionId)) ended.add(e.sessionId);
    else if (['answer_correct','answer_incorrect','answer_submitted'].includes(e.type)) result.submissions++;
    else if (e.type === 'help_requested') result.hints++;
    else if (e.type === 'split_requested') result.splits++;
    else if (e.type === 'paused') { result.pauses++; paused.add(e.sessionId); }
    else if (e.type === 'resumed' && paused.has(e.sessionId)) { result.returns++; paused.delete(e.sessionId); }
    else continue;
    evidenceIds.push(e.id); days.add(new Date(e.time).toLocaleDateString());
  }
  result.sessions = started.size; result.ended = ended.size; result.days = days.size;
  return result;
}
function renderHabits() {
  if (!state.profile) return '<p>开启成长记录后，可查看有授权依据的学习行为统计。</p>';
  const h = habitSummary();
  if (!h.evidenceIds.length) return '<p>尚无可统计的完整授权记录。请在开始新一轮学习前开启“记录应用内学习过程”和“更新我的成长记录”。' +
    (state.active && !state.cognitiveCoverage ? '当前学习缺少完整记录，请先结束本轮，再开始新一轮；仅刷新页面不会补齐记录。' : '') +
    '</p><p class="muted">近 30 天有 ' + h.excluded + ' 条记录因授权、会话信息缺失或编号冲突未纳入统计。旧记录不补算；没有记录不代表没有学习。</p>';
  return '<p class="muted">近 30 天 · 当前保留记录 · ' + h.days + ' 个记录日期。以下为实际行为次数，不是态度或韧性评分。</p><dl>' +
    [['开始学习', h.sessions + ' 次'], ['已记录开始与结束', h.ended + ' 次'], ['提交作答', h.submissions + ' 次'],
      ['请求提示', h.hints + ' 次'], ['请求拆分步骤', h.splits + ' 次'], ['暂停休息', h.pauses + ' 次'], ['暂停后恢复', h.returns + ' 次']]
      .map(([label,value]) => '<dt>' + label + '</dt><dd>' + value + '</dd>').join('') + '</dl>' +
    '<p>专注时长、走神、策略灵活性与长期学习态度：尚无可靠测量。结束学习不等于完成或掌握题目，求助和休息不代表态度差。</p>' +
    '<details><summary>查看统计依据</summary><p>' + esc(new Date(h.since).toLocaleDateString()) + ' 至 ' + esc(new Date(h.until).toLocaleDateString()) +
    '；证据 ' + h.evidenceIds.length + ' 条，未纳入的记录 ' + h.excluded + ' 条。最多保留 500 条事件，删除后会重新计算。</p><p>证据编号：' + esc(h.evidenceIds.join('、')) +
    '</p><button class="secondary" onclick="openLocalRecords()">查看或删除记录</button></details>';
}
function touch() { lastActivity = Date.now(); }
// Ephemeral draft signal: never send text to inference or turn it into a profile label.
let draftCareSource = 'chat', draftCareTimer = null;
function cancelDraftCare() {
  if (draftCareTimer !== null) clearTimeout(draftCareTimer);
  draftCareTimer = null;
}
function draftNeedsCare(value) {
  return String(value).split(/[，。！？!?；;\n]/).some(part => {
    const text = part.replace(/\s/g, '');
    if (/不是|没有|不觉得|不再|不想放弃|别说|不要说|比如|例如|他说|她说|[“”「」"‘’]/.test(text)) return false;
    return /好难(?:啊|呀|哦|$)|太难(?:了|啦|$)|不想(?:做|学|写)(?:了|下去|这道题|$)|做不下去了|学不下去了|想放弃(?:了|$)|好烦(?:啊|呀|$)|太累了/.test(text);
  });
}
function presentDraftCare(source) {
  cancelDraftCare(); draftCareSource = source;
  boundaryHintWait = null; stopChat(); conversationRevision++; submissionPending = false;
  busy = false; liveUser = ''; liveAnswer = '';
  if (typeof invalidateActive === 'function') invalidateActive('draft_emotional_support', true);
  modal = false; showOffer('draft-care');
}
function checkDraftCare(value, source, composing = false) {
  if (composing) return;
  const distressed = draftNeedsCare(value);
  if (!distressed) { cancelDraftCare(); return; }
  if ((source === 'study' && !state.active) ||
      !workVisible || catalog || current !== source) return;
  if (draftCareTimer !== null && draftCareSource === source) return;
  cancelDraftCare(); draftCareSource = source;
  draftCareTimer = setTimeout(() => {
    draftCareTimer = null;
    const latest = source === 'chat' ? el('chat-input')?.value ?? chatInput : state.answer;
    if (!draftNeedsCare(latest) || (source === 'study' && !state.active) ||
        !workVisible || catalog || current !== source) return;
    presentDraftCare(source);
  }, 5000);
}
function updateChatDraft(value, composing = false) {
  chatInput = value; touch();
  if (typeof invalidateActive === 'function') invalidateActive('typing');
  checkDraftCare(value, 'chat', composing);
}
function showHome() {
  cancelDraftCare();
  if (typeof invalidateActive === 'function') { invalidateActive('home'); save(); }
  stopChat(); workVisible = false; touch();
  el('resume-label').textContent = state.active ? '继续上次的学习' : '开始一段专注学习';
  el('resume-title').textContent = state.active ? tasks[state.task][0] : '按自己的节奏，探索一个知识点';
  el('resume-button').textContent = state.active ? '继续学习' : '开始学习';
  el('home').classList.add('active'); el('work').classList.remove('active');
}
function openWork(section, remember = true) {
  if (remember && !workVisible) rememberPage();
  el('home').classList.remove('active'); el('work').classList.add('active');
  const wasVisible=workVisible; workVisible = true; tab(section, remember && wasVisible);
}
function tab(section, remember = true) {
  if (remember && workVisible && section !== (catalog?'catalog':current)) rememberPage();
  if (section !== current) cancelDraftCare();
  if (typeof invalidateActive === 'function' && section !== current) { invalidateActive('navigation'); save(); }
  if (current === 'chat' && section !== 'chat') stopChat();
  catalog = section === 'catalog'; current = catalog ? 'study' : section;
  visibleSince = Date.now(); touch();
  for (const name of ['study', 'growth', 'settings']) el(`nav-${name}`).classList.toggle('sel', name === current || (name === 'growth' && ['trajectory', 'causal'].includes(current)) || (name === 'settings' && current === 'records'));
  render();
}
function catalogMath(value) {
  // Escape source first. Only these fixed formatting tags can enter the page.
  return esc(value).replace(/[$`]/g, '')
    .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '<span class="math-fraction"><span>$1</span><span>$2</span></span>')
    .replace(/\\sqrt\{([^{}]*)\}/g, '√($1)')
    .replace(/\\(log|ln|sin)/g, '$1')
    .replace(/\^\{([^{}]*)\}/g, '<sup>$1</sup>')
    .replace(/_\{([^{}]*)\}/g, '<sub>$1</sub>');
}
function renderCatalog() {
  const chapters = ['函数基础与表示', '函数性质与变化', '指数与幂的运算', '对数与指数互化', '零点与方程', '函数最值与应用'];
  const types = { SC: '选择题', FB: '填空题', SA: '解答题' };
  const sections = [{ title: '条件、概念与推理', items: reviewedCatalog.filter(item => item.core >= 0).sort((a, b) => a.core - b.core) }]
    .concat(chapters.map(chapter => ({ title: chapter, items: reviewedCatalog.filter(item => item.chapter === chapter && item.core < 0) })));
  return '<section class="catalog-library" aria-labelledby="library-heading"><div class="catalog-library-heading"><h2 id="library-heading">章节目录</h2><span>48 道复核题</span></div>' +
    sections.map((section, c) => {
      const items = section.items;
      return '<details class="catalog-chapter"><summary><span class="chapter-number">' + String(c + 1).padStart(2, '0') + '</span><span>' + esc(section.title) + '</span><small>' + items.length + ' 题</small></summary><div class="chapter-items">' +
        items.map((item, i) => '<details class="catalog-question"><summary><span class="catalog-item-meta">' + String(i + 1).padStart(2, '0') + ' · ' + types[item.type] +
          (item.core >= 0 ? ' · 核心练习' : '') + '</span><span class="catalog-item-title">' + esc(item.title) + '</span></summary>' +
          '<div class="catalog-question-body"><p class="catalog-stem">' + catalogMath(item.stem) + '</p>' +
          (item.options.length ? '<ul class="catalog-options">' + item.options.map(option => '<li><b>' + esc(option.label) + '.</b> <span>' + catalogMath(option.text) + '</span></li>').join('') + '</ul>' : '') +
          '<button class="primary" onclick="start(' + taskQuestions.findIndex(task => task.id === item.id) + ')">和学伴一起练这道题</button>' +
          '</div></details>').join('') + '</div></details>';
    }).join('') + '</section>';
}
function render() {
  growthFrames.forEach(id => cancelAnimationFrame(id)); growthFrames.clear();
  const root = el('content');
  if (current === 'records') { renderLocalRecords(); return; }
  if (current === 'trajectory') { renderGrowthTrajectory(); return; }
  if (current === 'causal' && typeof renderCausal === 'function') { renderCausal(); return; }
  if (current === 'chat') { renderChat(); return; }
  if (current === 'study') {
    root.innerHTML = '<h1>专注学习</h1><p class="intro">按自己的节奏想一想，我们一起找到下一步。</p>' +
      '<div class="actions"><button class="secondary" onclick="openChat()">和学伴聊聊</button><button class="secondary" onclick="tab(catalog?\'study\':\'catalog\')">' + (catalog ? '继续学习' : '章节目录') + '</button></div>' +
      (state.active && !catalog ? '<div class="panel"><span class="tag">' + (state.paused ? '已暂停' : '进行中') + '</span><h2 style="margin-top:15px">' + esc(tasks[state.task][0]) + '</h2>' +
        '<div class="question" style="white-space:pre-wrap">' + catalogMath(tasks[state.task][1]) + '</div>' +
        (state.paused ? '<p>先放松一下，准备好后我们再继续。</p><button class="primary" onclick="resumeStudy()">继续学习</button>' :
          '<textarea id="study-answer" class="answer" maxlength="2000" aria-label="答案或思路" placeholder="在这里记下你的答案或思路" oninput="updateAnswer(this.value,event.isComposing)" oncompositionend="updateAnswer(this.value)">' + esc(state.answer) + '</textarea>' +
          '<button class="primary" onclick="submitAnswer()">提交答案</button><div class="actions"><button class="secondary" onclick="requestHelp(\'hint\')">给一点提示</button><button class="secondary" onclick="requestHelp(\'split\')">拆成小步骤</button></div>' +
          '<button class="secondary" style="width:100%;margin-top:10px" onclick="rest()">我想休息一会</button>') +
        (state.result ? renderAnswerFeedback() : '') + '<div id="active-intervention-panel"></div>' +
        '<div id="learning-actions">' + learningActions() + '</div>' +
        '<button class="secondary" style="width:100%;margin-top:12px" onclick="finishStudy()">结束本次学习</button></div>' :
        renderCatalog()) +
      (!state.record || !state.proactive ? '<p class="muted">如果希望学伴在思考停顿时主动询问，可到“设置”开启学习记录和主动提醒。</p>' :
        state.active && !state.coverage ? '<p class="muted">本次学习开始时未开启完整记录；结束后重新开始，主动提醒才会生效。</p>' : '') +
      '<p class="muted">你可以随时求助、暂停，或选择不接受学伴的建议。</p>';
  } else if (current === 'growth') {
    const reports = state.events.filter(e => e.type === 'feeling').slice(-3).reverse();
    const correct = state.events.some(e => e.type === 'answer_correct');
    const resumed = state.events.some(e => e.type === 'resumed');
    root.innerHTML = '<h1>我的成长</h1><p class="intro">从真实学习过程出发，不急着给自己贴标签。</p>' +
      '<button class="growth-entry" onclick="tab(\'trajectory\')"><span class="growth-entry-icon" aria-hidden="true">⬡</span><span><strong>查看成长轨迹</strong><small>知识 · 情绪与态度 · 学习习惯与态度</small><small>三维成长画像 · 示例体验</small></span><span aria-hidden="true">›</span></button>' +
      '<div class="panel"><div class="setting"><span>更新我的成长记录<small>使用已授权的学习记录与自报感受</small></span><input type="checkbox" ' + (state.profile ? 'checked' : '') + ' onchange="toggleSetting(\'profile\',this.checked)"></div></div>' +
      (state.profile && state.active ? '<div class="panel"><h2>此刻感觉怎么样？</h2><div class="chips"><button onclick="reportFeeling(\'有点累\')">有点累</button><button onclick="reportFeeling(\'有点烦躁\')">有点烦躁</button><button onclick="reportFeeling(\'状态不错\')">状态不错</button></div></div>' : '') +
      '<div class="panel"><h2>知识理解</h2>' + renderCognitive() + '</div>' +
      (typeof renderActiveReview === 'function' ? renderActiveReview() : '') +
      '<div class="panel"><h2>帮助方式与后测</h2><p>探索不同帮助方式，回顾练习中的理解变化。</p><button class="secondary" onclick="tab(\'causal\')">查看帮助与后测</button></div>' +
      recordCategoryPanel('emotion', '情绪记录') + recordCategoryPanel('companion', '学伴陪伴记录') +
      '<div class="panel"><h2>学习习惯与态度</h2>' + renderHabits() + '<button class="secondary" onclick="openLocalRecords(\'habit\')">查看或删除学习习惯记录</button></div>' +
      '<button class="secondary" onclick="openLocalRecords()">管理全部本机记录</button>';
  } else {
    root.innerHTML = '<h1>隐私与安全</h1><p class="intro">由你决定学伴可以记住什么、何时主动开口。</p><div class="panel">' +
      [['record', '记录应用内学习过程', '作答、求助和暂停等记录保存在本机'], ['proactive', '允许学伴主动提醒', '根据提交的思路与学习停顿，判断是否适合提出帮助'], ['strategyStudy','参与帮助策略评估','自愿开启：在同样适用的帮助方式间随机分配；合适的停顿时随机邀请或暂缓，记录后续作答。可随时关闭，主动求助始终可用。']].map(([key, label, detail]) =>
        '<div class="setting"><span>' + label + '<small>' + detail + '</small></span><input type="checkbox" aria-label="'+label+'" ' + (state[key] ? 'checked' : '') + ' onchange="toggleSetting(\'' + key + '\',this.checked)"></div>').join('') +
      '<p class="muted">请在开始学习前开启学习记录、主动提醒和成长记录。策略评估单独选择，默认关闭。后台窗口、休息与聊天时间不计入思考停顿。</p></div>' +
      '<div class="panel"><h2>管理本机记录</h2><p class="muted">查看学习、情绪、学习习惯与态度记录，按需选择删除。完整聊天仅在本次打开期间保留；开启成长记录后，核查所用的数学片段随引导证据保存在本机，可一并删除。</p><button class="secondary" style="width:100%;margin-bottom:12px" onclick="openLocalRecords()">管理本机记录</button><button class="danger" onclick="clearRecords()">清除我的学习记录</button></div>';
  }
  if (storageNotice) root.innerHTML += '<p class="muted">' + esc(storageNotice) + '</p>';
  if (typeof renderActiveCard === 'function') renderActiveCard();
  root.scrollTop = 0;
}
function updateAnswer(value, composing = false) {
  if (typeof invalidateActive === 'function') invalidateActive('answer_changed');
  stopChat(); conversationRevision++; submissionPending = false; submissionHint = ''; state.result = '';
  if (state.tutor.phase === 'complete') state.tutor = LearningFlow.initial();
  state.answer = value; touch(); save();
  const feedback = el('answer-feedback');
  if (feedback) feedback.remove();
  checkDraftCare(value, 'study', composing);
}
function learningActions() {
  return state.tutor.phase === 'complete' ? '<button class="primary" onclick="nextTask()">' + (state.task < tasks.length - 1 ? '进入下一题' : '完成本轮学习') + '</button>' :
    state.tutor.phase === 'reframe' ? '<button class="primary" onclick="restartCoaching()">换种方式重新来</button>' : '';
}
function completeCorrectAnswer(value, fromChat = false) {
  boundaryHintWait = null;
  if (typeof invalidateActive === 'function') invalidateActive('answer_correct', true);
  conversationRevision++; submissionPending = false;
  state.answer = value.slice(0, 2000);
  state.tutor.phase = 'complete'; state.tutor.attempts = 0; state.tutor.stuckCount = 0; state.tutor.stuckKey = '';
  state.result = '你做对了！这道题的引导结束，可以进入下一题。';
  submissionHint = state.result; chatNotice = ''; chatInput = '';
  if (fromChat) {
    cognitiveRecord('answer');
    messages = messages.concat([{ role: 'user', content: value }, { role: 'assistant', content: state.result }]).slice(-12);
  }
  event('answer_correct'); save(); render();
  if (!fromChat) revealFeedback();
}
function nextTask() {
  if (busy || state.tutor.phase !== 'complete') return;
  const next = state.task + 1; finishStudy(); if (next < tasks.length) start(next);
}
function returnToAnswerPage(answerText = '') {
  stopChat();
  if (answerText && state.active) {
    state.answer = answerText.slice(0, 2000);
    const assessment = LearningFlow.choiceAssessment(answerText);
    state.result = assessment === 'correct' ? '已把你刚才的答案带回作答区，请提交后继续。' : '已回到作答区。请检查并提交你的答案。';
  }
  submissionPending = false; chatNotice = '';
  if (state.active) { conversationRevision++; tab('study'); }
}
function restartCoaching() {
  if (busy) return;
  // Restart from the visual / reverse-thinking scaffold, not the original repeated question.
  state.tutor.phase = 'guide'; state.tutor.attempts = 0; state.tutor.stuckCount = 0; state.tutor.stuckKey = '';
  state.tutor.seen = state.tutor.seen.filter(id => !id.startsWith(LearningFlow.topic({ stem: tasks[state.task][1] }) + '_' + state.tutor.step + '_'));
  state.tutor.seen.push(LearningFlow.topic({ stem: tasks[state.task][1] }) + '_' + state.tutor.step + '_0');
  save(); openChat('请换个角度，带我从一个小步骤重新开始。');
}
function start(index) {
  if (!Number.isInteger(index) || !tasks[index]) return;
  if (state.active && state.task !== index) { alert('请先继续并结束当前学习，再选择其他内容。'); return; }
  if (!state.active) {
    cancelDraftCare();
    baselineStep = 'start';
    boundaryHintWait = null;
    state.cognitiveCoverage = state.record && state.profile;
    state.cognitiveSession = 'session-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
    state.cognitiveAssistance = state.cognitiveSeen.includes(index) ? 'unknown' : 'independent';
    state.cognitiveSeen = [...new Set(state.cognitiveSeen.concat(index))]; state.cognitiveLast = '';
    state.active = true; state.paused = false; state.task = index; state.answer = ''; state.result = ''; submissionHint = ''; submissionPending = false;
    state.tutor = LearningFlow.initial();
    state.coverage = state.record && state.proactive; conversationRevision++; messages = []; chatInput = ''; event('started');
  }
  tab('study');
}
function finishStudy() { cancelDraftCare(); boundaryHintWait = null; if (typeof invalidateActive === 'function') invalidateActive('session_finished', true); stopChat(); submissionPending = false; submissionHint = ''; event('finished'); state.active = false; state.paused = false; save(); conversationRevision++; messages = []; chatInput = ''; tab('catalog'); }
function resumeStudy() { if (!state.active || !state.paused) return; state.paused = false; event('resumed'); tab('study'); }
function rest() { if (!state.active || state.paused) return; cancelDraftCare(); boundaryHintWait = null; if (typeof invalidateActive === 'function') invalidateActive('paused', true); state.paused = true; event('paused'); tab('study'); }
function toggleSetting(key, value) {
  if(key==='strategyStudy'&&value&&!state.strategyStudy)state.studyEpoch=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
  if (!value && typeof invalidateActive === 'function') invalidateActive('consent_revoked', true);
  state[key] = value;
  if (!value && ['record', 'profile'].includes(key)) { state.cognitiveCoverage = false; state.cognitiveAssistance = 'unknown'; }
  if (!value && ['record', 'profile'].includes(key)) state.events = state.events.map(e => e.causal && !e.causal.outcome ?
    { ...e, causal: { ...e.causal, outcome: { time: Date.now(), y: null, missingReason: 'consent_revoked', independent: false, firstExposure: false } } } : e);
  if (!value && ['record', 'proactive'].includes(key)) { state.coverage = false; if (modal) closeModal('declined'); }
  touch(); save(); render();
}
function reportFeeling(value) {
  touch(); if (!state.profile) return;
  event('feeling', value);
  if (state.record && state.proactive && !state.paused && Date.now() >= state.cooldownUntil && value !== '状态不错') showOffer('rest');
  else render();
}
function clearRecords() {
  if (!confirm('清除本机的学习进度、记录与成长观察？')) return;
  cancelDraftCare();
  modal = false; el('modal').classList.remove('show');
  boundaryHintWait = null;
  if (typeof invalidateActive === 'function') invalidateActive('cleared', true);
  stopChat(); submissionPending = false; submissionHint = ''; state = defaults(); state.recordsSeeded = true; state.recordsSupplemented = true; conversationRevision++; messages = []; chatInput = ''; liveAnswer = ''; storageNotice = '';
  save(); render();
}
function answerCheckSuggestion() {
  if (state.task === 0) return '我们再检查一下答案或思路哦：既要保证它是一元二次方程，也要满足两个实根不相等。看看这两个条件是否都考虑到了，边界有没有漏掉。';
  if (state.task === 2) return '我们再检查一下答案或思路哦：先比较绝对值在区间两端的取值，再检查各段的候选最大值，并确认它确实能取到。';
  if (state.task >= 3) return LearningFlow.reviewSpec({ stem: tasks[state.task][1], tutor: LearningFlow.initial() }).questions[0];
  return '请明确写出你选择的选项或 x 的值，我们再一起检查它是否符合题意。';
}
function renderAnswerFeedback() {
  const empty = !state.answer.trim();
  const assessment = empty ? 'unknown' : assessTaskAnswer();
  const title = empty ? '先写下你的想法' : assessment === 'correct' ? '回答正确' : assessment === 'incorrect' ? '这次答案不正确' : '再检查一下答案或思路哦';
  const detail = empty ? state.result : taskAnswerFeedback();
  return '<section id="answer-feedback" class="answer-feedback ' + assessment + '" tabindex="-1" aria-labelledby="feedback-title">' +
    '<div class="feedback-heading"><span class="feedback-icon" aria-hidden="true">' + (assessment === 'correct' ? '✓' : assessment === 'incorrect' ? '!' : '…') +
    '</span><div><small>本次作答反馈</small><h2 id="feedback-title">' + title + '</h2></div></div>' +
    '<p class="feedback-detail">' + esc(detail) + '</p>' +
    (!empty && assessment !== 'correct' ? '<div class="feedback-guide"><strong>下一步 · 一起想一想</strong><p id="submission-hint" role="status">' + esc(submissionHint || '可以继续讲讲你的理解。') + '</p></div>' : '') +
    '<div class="actions"><button class="secondary" onclick="editSubmittedAnswer()">' + (empty ? '填写答案' : '修改答案') + '</button>' +
    (!empty && assessment !== 'correct' ? '<button class="primary" onclick="openChat()">' + (assessment === 'incorrect' ? '帮我理解这一处' : '讲讲我的理解') + '</button>' : '') + '</div></section>';
}
function revealFeedback() {
  const card = el('answer-feedback');
  if (!card) return;
  card.focus({ preventScroll: true });
  card.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
}
function editSubmittedAnswer() {
  const answer = el('study-answer');
  if (!answer) return;
  answer.focus({ preventScroll: true });
  answer.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' });
}
function submitAnswer() {
  if (busy || !state.active || state.paused) return;
  touch(); if (!state.answer.trim()) { state.result = '请先写下你的答案或思路。'; submissionHint = ''; render(); revealFeedback(); return; }
  const activePreparation = typeof activePrepare === 'function' ? activePrepare() : null;
  cognitiveRecord('answer');
  if (LearningFlow.finalAssessment({ stem: tasks[state.task][1], draft: state.answer, turn: 'submission' }) === 'correct') {
    completeCorrectAnswer(state.answer); return;
  }
  if(typeof activeStudySubmission==='function'&&activePreparation&&state.events.some(e=>e.cognitive&&!activePreparation.beforeIds.includes(e.id)))activeStudySubmission();
  if (taskQuestions[state.task].type === 'SC') {
    const assessment = assessTaskAnswer();
    state.result = assessment === 'correct' ? '这次选择正确。接下来讲讲你的依据。' : assessment === 'incorrect' ? '这次选择还不正确，我们一起检查思路。' : answerCheckSuggestion();
    event(assessment === 'correct' ? 'answer_correct' : assessment === 'incorrect' ? 'answer_incorrect' : 'answer_submitted');
  } else { state.result = answerCheckSuggestion(); event('answer_submitted'); }
  if (activePreparation) {
    submissionHint = '可以继续说明你的依据，或按自己的节奏检查。'; submissionPending = false;
    render(); revealFeedback();
    return evaluateActive('submission', state.answer, activePreparation);
  }
  submissionHint = LearningFlow.select({ stem: tasks[state.task][1], draft: state.answer, turn: 'submission', tutor: state.tutor,
    assessment: assessTaskAnswer() }).content;
  state.cognitiveAssistance = 'assisted'; save();
  submissionPending = true;
  chatInput = '我提交了上面的答案或思路。反馈：' + state.result + ' 请针对我的思路给一个下一步提示，用问题引导我自己检查，不要告诉我结果。';
  render();
  revealFeedback();
  return sendChat();
}
function requestHelp(kind) {
  if (typeof invalidateActive === 'function') { invalidateActive('manual_help', true); state.cognitiveAssistance = 'assisted'; }
  event(kind === 'split' ? 'split_requested' : 'help_requested');
  openChat(kind === 'split' ? '请把这道题拆成小步骤，先引导我做第一步，不要一次给出完整答案。' : '我在这道题上卡住了，请根据我的思路给一点提示，先不要直接给完整答案。');
}
function showOffer(kind) {
  if (modal || busy) return; offer = kind; modal = true; event('offer', kind);
  el('modal-title').textContent = kind === 'rest' ? '要不要休息一会？' : '需要一点帮助吗？';
  el('modal-text').textContent = kind === 'rest' ? '你刚才说有点累或烦躁。我们先放松一下，做几次慢呼吸吧。' : '已经安静思考一会儿了。要不要一起看看卡在哪一步？';
  el('modal-reason').textContent = kind === 'rest' ? '根据你刚才自己填写的感受。' : '你在这道题上连续停顿了约 3 分钟。停顿也可能是在思考。';
  el('modal-accept').textContent = kind === 'rest' ? '好，休息一会' : '和学伴一起想';
  if (kind === 'boundary') {
    el('modal-title').textContent = '应该停一停了';
    el('modal-text').textContent = '已经思考了很久了，要不要让学伴给你一个提示？';
    el('modal-reason').textContent = '刚才的条件还需要再检查一下，也可以继续自己想。';
    el('modal-accept').textContent = '给我提示';
  }
  if (kind === 'draft-care') {
    el('modal-title').textContent = '先照顾一下自己的感受';
    el('modal-text').textContent = '遇到难题觉得难、暂时不想做，都很正常。不用急着逼自己，要不要先休息一下，等准备好了，我们再一起重新看一看？';
    el('modal-reason').textContent = '看到你正在输入的感受，学伴先来陪陪你。内容还没有发送。';
    el('modal-accept').textContent = '好，先休息一下';
  }
  el('modal').classList.add('show');
  el('modal-accept').focus();
}
function closeModal(response = 'later') {
  modal = false; el('modal').classList.remove('show');
  state.cooldownUntil = CompanionPolicy.cooldown(response, Date.now()); touch(); event('offer_response', response);
  if (offer === 'draft-care') {
    el(draftCareSource === 'chat' ? 'chat-input' : 'study-answer')?.focus();
  }
}
function accept() {
  const kind = offer; closeModal('accepted');
  if (kind === 'boundary') {
    if (!state.active || state.task !== 0 || state.paused || state.tutor.phase === 'complete') return;
    openChat();
    return baselineReply('我已经独立思考三分钟了，请给我一个提示。', true);
  }
  if (kind === 'rest' || kind === 'draft-care') rest(); else requestHelp('hint');
}
function openChat(question = '') {
  submissionPending = false;
  if (question) chatInput = question;
  tab('chat');
  if (question) sendChat();
}
function renderChat() {
  el('content').innerHTML = '<h1>和学伴聊聊</h1><p class="intro">把问题或想法告诉我，我们一步一步来。</p>' +
    (state.active ? '<details class="panel"><summary>' + esc(tasks[state.task][0]) + '</summary><p style="white-space:pre-wrap">' + catalogMath(tasks[state.task][1]) + '</p></details>' : '') +
    (state.active && state.task === 0 ? '<button class="secondary" onclick="restartFilming()">从头开始本题对话</button>' : '') +
    '<div id="chat-messages"></div><p id="chat-status" class="muted" role="status"></p><div id="active-intervention-panel"></div>' +
    '<div id="learning-actions">' + learningActions() + '</div>' +
    '<textarea id="chat-input" class="answer" maxlength="300" aria-label="给学伴的消息" placeholder="例如：我不懂为什么这里不能等于零…" oninput="updateChatDraft(this.value,event.isComposing)" oncompositionend="updateChatDraft(this.value)">' + esc(chatInput) + '</textarea>' +
    '<div class="actions"><button id="chat-clear" class="secondary" onclick="clearChat()">清空对话</button><button id="chat-send" class="primary" onclick="busy?stopChat():sendChat()">发送</button></div>';
  updateChat();
  if (typeof renderActiveCard === 'function') renderActiveCard();
}
function updateChat() {
  const actions = el('learning-actions'); if (actions) actions.innerHTML = learningActions();
  if (current === 'study' && state.result && !catalog) {
    const hint = el('submission-hint');
    if (hint) hint.textContent = submissionHint || chatNotice || '继续写下你的想法，或者接着和学伴讨论。';
  }
  if (current !== 'chat') return;
  const list = messages.concat(busy ? [...(liveUser ? [{ role: 'user', content: liveUser }] : []), ...(liveAnswer ? [{ role: 'assistant', content: liveAnswer }] : [])] : []);
  el('chat-messages').innerHTML = list.length ? list.map(m => '<div class="hint" style="background:' + (m.role === 'user' ? '#f5e9c9' : '#fff') + '"><div class="avatar">' + (m.role === 'user' ? '我' : '伴') + '</div><div style="min-width:0"><small>' + (m.role === 'user' ? '我' : '学伴') + '</small><p style="white-space:pre-wrap;overflow-wrap:anywhere">' + esc(m.content) + '</p></div></div>').join('') : '<p class="muted">哪里没想明白？可以直接问我。</p>';
  el('chat-status').textContent = chatNotice || (busy ? (liveAnswer ? '正在回复…' : '学伴正在思考…') : engineStatus);
  el('chat-input').disabled = busy;
  el('chat-clear').disabled = busy;
  el('chat-send').disabled = false;
  el('chat-send').textContent = busy ? '停止回复' : '发送';
}
function clearChat() { if (busy) return; boundaryHintWait = null; conversationRevision++; messages = []; chatInput = ''; liveAnswer = ''; chatNotice = ''; renderChat(); }
function stopChat() { if (aborter) { aborter.abort(); chatNotice = '回复已停止，可以修改问题后重新发送。'; } }
async function sendChat() {
  const question = (el('chat-input')?.value || chatInput).trim(); if (busy || modal || !question) return;
  if (!submissionPending && state.active && (state.task === 0 ||
      (state.task === 1 && LearningFlow.questionRoute({question}) === 'answer_request'))) { await baselineReply(question); return; }
  boundaryHintWait = null;
  const isQuestion = LearningFlow.questionRoute({ question, turn: 'reply' });
  if (!submissionPending && state.active && LearningFlow.isClosure(question)) {
    returnToAnswerPage();
    return;
  }
  if (!submissionPending && state.active && LearningFlow.finalAssessment({ stem: tasks[state.task][1], question }) === 'correct') {
    completeCorrectAnswer(question, true);
    return;
  }
  const activePreparation = typeof activePrepare === 'function' ? activePrepare() : null;
  if (typeof invalidateActive === 'function') invalidateActive('new_chat');
  busy = true; liveUser = question; liveAnswer = ''; chatInput = ''; chatNotice = ''; touch();
  aborter = new AbortController(); const thisAbort = aborter;
  const revision = conversationRevision; const isSubmission = submissionPending; submissionPending = false;
  const input = { question, stem: state.active ? tasks[state.task][1] : '',
    draft: state.active ? state.answer : '', history: messages.slice(-4),
    tutor: state.active ? state.tutor : undefined, turn: isSubmission ? 'submission' : 'reply',
    assessment: state.active && state.result ? assessTaskAnswer() : 'unknown' };
  if (el('chat-input')) el('chat-input').value = '';
  updateChat(); let complete = false, guidanceResult;
  try {
    const response = await fetch('/api/chat', { method: 'POST', signal: thisAbort.signal,
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
    if (!response.ok) { const detail = await response.json(); throw new Error(detail.error || '回复失败，请重试。'); }
    const reader = response.body.getReader(), decoder = new TextDecoder(); let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      let boundary;
      while ((boundary = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, boundary).trim(); buffer = buffer.slice(boundary + 1);
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim(); if (data === '[DONE]') continue;
        const packet = JSON.parse(data);
        if (packet.error) throw new Error('本机模型回复失败，请重试。');
        // Independently enforce the boundary in the browser, including against an old server.
        if (packet.stop === true) {
          const guidance = input.tutor || LearningFlow.questionRoute(input) ? LearningFlow.select(input, { ...packet.evaluation, answerKey: packet.answerKey }) : TutoringPolicy.select(input, packet.strategy);
          guidanceResult = guidance;
          liveAnswer = guidance.content;
          chatNotice = guidance.evaluation?.source === 'model-semantic' ? '已根据这次解释检查理解。' : '当前使用本地引导策略。';
        }
        if (packet.stop === true) { complete = true; if (packet.stopped_limit) liveAnswer += '\n（可以继续追问。）'; }
      }
      updateChat();
      if (done) break;
    }
    if (!complete || !liveAnswer.trim()) throw new Error('回复未完成，请重新发送。');
    if (revision === conversationRevision) {
      messages = messages.concat([{ role: 'user', content: question }, { role: 'assistant', content: liveAnswer }]).slice(-12);
      submissionHint = liveAnswer;
      if (!isSubmission && !isQuestion) cognitiveRecord('explanation', input, guidanceResult?.evaluation);
      if (state.active) state.cognitiveAssistance = 'assisted';
      if (guidanceResult?.tutor && state.active) state.tutor = guidanceResult.tutor;
      scheduleBoundaryHint(guidanceResult);
      event('chat_completed');
    }
  } catch (error) {
    if (revision === conversationRevision) {
      if (thisAbort.signal.aborted) {
        chatInput = question;
        chatNotice = '回复已停止，可以修改问题后重新发送。';
      } else {
        const localResult = input.tutor || LearningFlow.questionRoute(input) ? LearningFlow.select(input) : TutoringPolicy.select(input);
        const localHint = localResult.content;
        messages = messages.concat([{ role: 'user', content: question }, { role: 'assistant', content: localHint }]).slice(-12);
        submissionHint = localHint;
        if (!isSubmission && !isQuestion) cognitiveRecord('explanation', input, localResult.evaluation);
        if (state.active) state.cognitiveAssistance = 'assisted';
        if (localResult.tutor && state.active) state.tutor = localResult.tutor;
        scheduleBoundaryHint(localResult);
        save();
        chatNotice = '模型暂不可用，当前使用本地引导策略。';
      }
    }
  } finally {
    busy = false; aborter = null; liveAnswer = ''; liveUser = ''; touch();
    updateChat();
    if (current === 'chat') el('chat-input').value = chatInput;
  }
  if (activePreparation && !boundaryHintWait && revision === conversationRevision && !thisAbort.signal.aborted && !isSubmission && !isQuestion)
    await evaluateActive('explanation', question, activePreparation);
}
async function checkHealth() {
  try {
    const response = await fetch('/api/health', { signal: AbortSignal.timeout(2500) });
    const data = await response.json(); engineReady = data.ready === true;
    engineStatus = engineReady ? '离线学伴已就绪' :
      typeof data.status === 'string' && !/gguf|mindspore|llama|qwen|\.ms\b|python|companion_/i.test(data.status) ? data.status : '正在准备离线学伴…';
  } catch (_) { engineReady = false; engineStatus = '本地服务未连接，请重新双击“打开学伴”。'; }
  if (submissionPending && engineReady && current === 'study' && workVisible && state.active && !state.paused && !document.hidden) sendChat();
  updateChat();
}
document.addEventListener('visibilitychange', () => { visibleSince = Date.now(); touch(); if (document.hidden) stopChat(); });
window.addEventListener('blur', () => { visibleSince = Date.now(); });
window.addEventListener('focus', () => { visibleSince = Date.now(); touch(); });
setInterval(() => {
  if (boundaryHintTick()) return;
  if (typeof activeTick === 'function' && state.task < 3 && state.profile) { activeTick(); return; }
  if (CompanionPolicy.shouldOffer({ ...state, studyVisible: workVisible && current === 'study' && !catalog && !document.hidden && document.hasFocus(),
    modal, busy, lastActivity, visibleSince }, Date.now())) showOffer('help');
}, 1000);
setInterval(checkHealth, 4000);
// One-time, user-requested local sample restoration; deletions are not reseeded on reload.
if (!state.recordsSupplemented) restoreStudentDemoRecords();
const enrichedRecords = enrichKnowledgeRecords(state.demoRecords);
if (JSON.stringify(enrichedRecords)!==JSON.stringify(state.demoRecords)) persistRecordChange({...state,demoRecords:enrichedRecords});
checkHealth(); showHome();
if (filmingEntry) { state.active = false; openWork('study'); start(0); openChat(); }
