/* ============================================================
   GAME DATA — 真实 2026 车队与近五年正式车手
   非官方粉丝原型。F1、车队与车手名称/商标归各自权利人所有。
   车辆性能、预算与目标均为玩法平衡设定，不代表真实预测。
   ============================================================ */

const SEASON_YEAR = 2026;
const DESIGN_POINTS = 12;
const MAX_STAT = 99;
const START_CONFIDENCE = 58;
const SAVE_SCHEMA = 3;
const SAVE_KEY = 'paddock_boss_save';
const SAVE_BACKUP_KEY = 'paddock_boss_save_backup';
const LEGACY_SAVE_KEYS = ['paddock_boss_save_v5', 'paddock_boss_save_v4', 'paddock_boss_save_v3', 'paddock_boss_save_v2', 'paddock_boss_save_v1'];
const SAVE_SLOT_COUNT = 3;
const SLOT_SAVE_PREFIX = 'paddock_boss_save_slot_';
const SLOT_BACKUP_PREFIX = 'paddock_boss_save_slot_backup_';
const SLOT_INIT_KEY = 'paddock_boss_slot_system_initialized_v1';
const DRIVER_POOL_YEARS = '2021–2026';
const PREP_MAX = 18;
const PRACTICE_PROGRAMS = [
  { id: 'setup', name: '平衡调校', en: 'BALANCE', stat: 'setup', gain: 6, desc: '采集前后轴与胎温数据，提升正赛初始设定。' },
  { id: 'tyre', name: '长距离模拟', en: 'LONG RUN', stat: 'tyre', gain: 6, desc: '高油量模拟比赛节奏，降低轮胎衰退。' },
  { id: 'quali', name: '排位冲刺', en: 'QUALI SIM', stat: 'quali', gain: 6, desc: '复刻低油量软胎窗口，寻找最后半秒。' }
];

const TEAMS = [
  {
    id: 'mclaren', name: 'McLaren Mastercard F1 Team', cn: '迈凯伦', mono: 'MC', abbr: 'MCL',
    city: '沃金', country: '英国',
    color: '#ff8700', color2: '#47c7fc',
    budget: 34.0,
    base: { aero: 91, chassis: 89, power: 88, reliability: 90 },
    targetCC: 1, targetPos: 2, difficulty: 1, diffLabel: '卫冕冠军',
    tagline: '木瓜色的王朝，需要第二个章节。',
    desc: '围场里最完整的赛车与最稳定的车手组合。资源、速度、信心都在你这边，唯一的敌人是自满。',
    goal: '卫冕双冠：守住车队与车手世界冠军。',
    drivers: ['norris', 'piastri']
  },
  {
    id: 'ferrari', name: 'Scuderia Ferrari HP', cn: '法拉利', mono: 'SF', abbr: 'FER',
    city: '马拉内罗', country: '意大利',
    color: '#ff1e00', color2: '#ffdc4a',
    budget: 32.0,
    base: { aero: 89, chassis: 87, power: 90, reliability: 84 },
    targetCC: 2, targetPos: 3, difficulty: 2, diffLabel: '冠军挑战者',
    tagline: '汉密尔顿与勒克莱尔，历史级的双核。',
    desc: '七届世界冠军与法拉利未来核心同处一间车库。所有人都知道这套阵容意味着什么，也知道失败会被怎样书写。',
    goal: '终结冠军荒：车队年度前二。',
    drivers: ['leclerc', 'hamilton']
  },
  {
    id: 'mercedes', name: 'Mercedes-AMG PETRONAS F1 Team', cn: '梅赛德斯', mono: 'MB', abbr: 'MER',
    city: '布拉克利', country: '德国',
    color: '#27f4d2', color2: '#d7e0e8',
    budget: 31.0,
    base: { aero: 87, chassis: 88, power: 86, reliability: 90 },
    targetCC: 3, targetPos: 4, difficulty: 2, diffLabel: '银箭复兴',
    tagline: '秩序、工程，与一位不再年轻的领袖。',
    desc: '拉塞尔的稳定与安东内利的天赋组成了梅赛德斯的现在与未来。新规周期，是银箭重新定义秩序的机会。',
    goal: '重返巅峰：车队年度前三。',
    drivers: ['russell', 'antonelli']
  },
  {
    id: 'redbull', name: 'Oracle Red Bull Racing', cn: '红牛', mono: 'RB', abbr: 'RBR',
    city: '米尔顿凯恩斯', country: '奥地利',
    color: '#3671c6', color2: '#ffd12e',
    budget: 31.0,
    base: { aero: 85, chassis: 84, power: 93, reliability: 82 },
    targetCC: 3, targetPos: 3, difficulty: 3, diffLabel: '争冠强队',
    tagline: '维斯塔潘，与一个新时代的搭档。',
    desc: '红牛把二号席位交给年轻的哈贾尔，把冠军压力继续留给维斯塔潘。动力与效率仍是他们最锋利的武器。',
    goal: '新规时代继续争冠：车队年度前三。',
    drivers: ['verstappen', 'hadjar']
  },
  {
    id: 'aston', name: 'Aston Martin Aramco F1 Team', cn: '阿斯顿·马丁', mono: 'AM', abbr: 'AST',
    city: '银石', country: '英国',
    color: '#229971', color2: '#cedc00',
    budget: 27.0,
    base: { aero: 83, chassis: 84, power: 82, reliability: 86 },
    targetCC: 5, targetPos: 8, difficulty: 3, diffLabel: '老将雄心',
    tagline: '阿隆索的最后一舞，需要一台配得上它的车。',
    desc: '新工厂、新赞助、新规则。阿斯顿·马丁拥有围场里最昂贵的野心，也拥有最急躁的董事会。',
    goal: '向第一集团靠近：车队年度前五。',
    drivers: ['alonso', 'stroll']
  },
  {
    id: 'williams', name: 'Atlassian Williams Racing', cn: '威廉姆斯', mono: 'WL', abbr: 'WIL',
    city: '格罗夫', country: '英国',
    color: '#3fa9f5', color2: '#ffffff',
    budget: 24.0,
    base: { aero: 82, chassis: 81, power: 84, reliability: 85 },
    targetCC: 5, targetPos: 9, difficulty: 4, diffLabel: '中游黑马',
    tagline: '阿尔本与塞恩斯，围场最被低估的搭档。',
    desc: '威廉姆斯正在恢复一支老牌车队的尊严。赛车不华丽，但两位车手都懂得如何把机会变成积分。',
    goal: '守住中游领先：车队年度前五。',
    drivers: ['albon', 'sainz']
  },
  {
    id: 'alpine', name: 'BWT Alpine F1 Team', cn: '阿尔派', mono: 'AL', abbr: 'ALP',
    city: '恩斯通', country: '法国',
    color: '#00a1e8', color2: '#ff87bc',
    budget: 22.0,
    base: { aero: 79, chassis: 81, power: 78, reliability: 85 },
    targetCC: 6, targetPos: 11, difficulty: 4, diffLabel: '中游突围',
    tagline: '速度之外，阿尔派需要一个秩序。',
    desc: '加斯利的经验配上科拉平托的锐气。资源不算充裕，但混乱的中游集团里，每个周末都藏着机会。',
    goal: '突破中游天花板：车队年度前六。',
    drivers: ['gasly', 'colapinto']
  },
  {
    id: 'racingbulls', name: 'Visa Cash App Racing Bulls', cn: '竞速公牛', mono: 'VC', abbr: 'RBU',
    city: '法恩扎', country: '意大利',
    color: '#8aa8ff', color2: '#ffffff',
    budget: 20.0,
    base: { aero: 78, chassis: 80, power: 79, reliability: 83 },
    targetCC: 7, targetPos: 12, difficulty: 4, diffLabel: '青年军',
    tagline: '劳森与林德布拉德，红牛体系的下一个答案。',
    desc: '一台有冲劲的赛车，一间敢于冒险的车库。年轻的阵容会犯错，但也会在别人犹豫时完成超车。',
    goal: '杀入积分区争夺：车队年度前七。',
    drivers: ['lawson', 'lindblad']
  },
  {
    id: 'haas', name: 'Haas F1 Team', cn: '哈斯', mono: 'HA', abbr: 'HAA',
    city: '坎纳波利斯', country: '美国',
    color: '#e8e8e8', color2: '#e6002b',
    budget: 19.0,
    base: { aero: 77, chassis: 78, power: 78, reliability: 83 },
    targetCC: 8, targetPos: 14, difficulty: 5, diffLabel: '资源挑战',
    tagline: '奥康与贝尔曼，经验与勇气的组合。',
    desc: '有限的资源，极致务实的工程文化。哈斯需要的不是奇迹，而是每一站都少犯一个错误。',
    goal: '稳定拿分：车队年度前八。',
    drivers: ['ocon', 'bearman']
  },
  {
    id: 'audi', name: 'Audi Revolut F1 Team', cn: '奥迪', mono: 'AU', abbr: 'AUD',
    city: '欣维尔', country: '德国',
    color: '#e4002b', color2: '#c8ced6',
    budget: 19.0,
    base: { aero: 75, chassis: 77, power: 76, reliability: 82 },
    targetCC: 8, targetPos: 15, difficulty: 5, diffLabel: '新厂队',
    tagline: '四环的第一年，先学会完成比赛。',
    desc: '奥迪用全资厂队身份接管索伯班底。经验丰富的霍肯伯格与博托莱托将负责把第一台车带进中游。',
    goal: '新厂队站稳脚跟：车队年度前八。',
    drivers: ['hulkenberg', 'bortoleto']
  },
  {
    id: 'cadillac', name: 'Cadillac Formula 1 Team', cn: '凯迪拉克', mono: 'CD', abbr: 'CAD',
    city: '夏洛特', country: '美国',
    color: '#c4a661', color2: '#0a2240',
    budget: 16.0,
    base: { aero: 70, chassis: 72, power: 70, reliability: 77 },
    targetCC: 10, targetPos: 18, difficulty: 5, diffLabel: '从零开始',
    tagline: '佩雷兹与博塔斯，把白纸带进积分区。',
    desc: '全新的美国车队，迟到的准备时间，以及两位拒绝退场的老将。每一个完赛圈，都是车队历史上的第一次。',
    goal: '拒绝垫底：车队年度前十。',
    drivers: ['perez', 'bottas']
  }
];

const DRIVERS = [
  /* ---------- 2026 race grid ---------- */
  { id: 'norris', name: 'Lando Norris', cn: '兰多·诺里斯', flag: 'GBR', country: '英国', age: 26, num: 1, teamId: 'mclaren', pace: 94, consistency: 92, tyre: 90, wet: 91, feedback: 91, ovr: 94, salary: 1.00, contractEnd: 2028 },
  { id: 'piastri', name: 'Oscar Piastri', cn: '奥斯卡·皮亚斯特里', flag: 'AUS', country: '澳大利亚', age: 25, num: 81, teamId: 'mclaren', pace: 93, consistency: 91, tyre: 89, wet: 88, feedback: 89, ovr: 92, salary: 0.95, contractEnd: 2028 },
  { id: 'leclerc', name: 'Charles Leclerc', cn: '夏尔·勒克莱尔', flag: 'MON', country: '摩纳哥', age: 29, num: 16, teamId: 'ferrari', pace: 94, consistency: 86, tyre: 87, wet: 89, feedback: 88, ovr: 92, salary: 1.00, contractEnd: 2029 },
  { id: 'hamilton', name: 'Lewis Hamilton', cn: '刘易斯·汉密尔顿', flag: 'GBR', country: '英国', age: 41, num: 44, teamId: 'ferrari', pace: 91, consistency: 88, tyre: 91, wet: 94, feedback: 96, ovr: 91, salary: 1.10, contractEnd: 2027 },
  { id: 'verstappen', name: 'Max Verstappen', cn: '马克斯·维斯塔潘', flag: 'NED', country: '荷兰', age: 29, num: 3, teamId: 'redbull', pace: 97, consistency: 92, tyre: 90, wet: 96, feedback: 96, ovr: 96, salary: 1.20, contractEnd: 2028 },
  { id: 'hadjar', name: 'Isack Hadjar', cn: '伊萨克·哈贾尔', flag: 'FRA', country: '法国', age: 22, num: 6, teamId: 'redbull', pace: 85, consistency: 81, tyre: 81, wet: 79, feedback: 82, ovr: 83, salary: 0.35, contractEnd: 2027 },
  { id: 'russell', name: 'George Russell', cn: '乔治·拉塞尔', flag: 'GBR', country: '英国', age: 28, num: 63, teamId: 'mercedes', pace: 91, consistency: 89, tyre: 88, wet: 87, feedback: 91, ovr: 90, salary: 0.85, contractEnd: 2026 },
  { id: 'antonelli', name: 'Andrea Kimi Antonelli', cn: '基米·安东内利', flag: 'ITA', country: '意大利', age: 20, num: 12, teamId: 'mercedes', pace: 86, consistency: 77, tyre: 80, wet: 82, feedback: 78, ovr: 82, salary: 0.50, contractEnd: 2027 },
  { id: 'alonso', name: 'Fernando Alonso', cn: '费尔南多·阿隆索', flag: 'ESP', country: '西班牙', age: 45, num: 14, teamId: 'aston', pace: 88, consistency: 92, tyre: 90, wet: 92, feedback: 98, ovr: 89, salary: 0.80, contractEnd: 2026 },
  { id: 'stroll', name: 'Lance Stroll', cn: '兰斯·斯特罗尔', flag: 'CAN', country: '加拿大', age: 28, num: 18, teamId: 'aston', pace: 82, consistency: 79, tyre: 81, wet: 86, feedback: 79, ovr: 81, salary: 0.50, contractEnd: 2027 },
  { id: 'gasly', name: 'Pierre Gasly', cn: '皮埃尔·加斯利', flag: 'FRA', country: '法国', age: 30, num: 10, teamId: 'alpine', pace: 86, consistency: 85, tyre: 86, wet: 87, feedback: 86, ovr: 85, salary: 0.55, contractEnd: 2027 },
  { id: 'colapinto', name: 'Franco Colapinto', cn: '弗兰科·科拉平托', flag: 'ARG', country: '阿根廷', age: 23, num: 43, teamId: 'alpine', pace: 83, consistency: 77, tyre: 79, wet: 78, feedback: 77, ovr: 80, salary: 0.30, contractEnd: 2027 },
  { id: 'albon', name: 'Alexander Albon', cn: '亚历山大·阿尔本', flag: 'THA', country: '泰国', age: 30, num: 23, teamId: 'williams', pace: 87, consistency: 86, tyre: 87, wet: 83, feedback: 87, ovr: 86, salary: 0.55, contractEnd: 2027 },
  { id: 'sainz', name: 'Carlos Sainz', cn: '卡洛斯·塞恩斯', flag: 'ESP', country: '西班牙', age: 32, num: 55, teamId: 'williams', pace: 89, consistency: 89, tyre: 90, wet: 85, feedback: 91, ovr: 88, salary: 0.80, contractEnd: 2027 },
  { id: 'lawson', name: 'Liam Lawson', cn: '利亚姆·劳森', flag: 'NZL', country: '新西兰', age: 24, num: 30, teamId: 'racingbulls', pace: 83, consistency: 80, tyre: 80, wet: 81, feedback: 79, ovr: 81, salary: 0.35, contractEnd: 2027 },
  { id: 'lindblad', name: 'Arvid Lindblad', cn: '阿尔维德·林德布拉德', flag: 'GBR', country: '英国', age: 19, num: 41, teamId: 'racingbulls', pace: 81, consistency: 73, tyre: 75, wet: 74, feedback: 73, ovr: 76, salary: 0.20, contractEnd: 2027 },
  { id: 'ocon', name: 'Esteban Ocon', cn: '埃斯特班·奥康', flag: 'FRA', country: '法国', age: 30, num: 31, teamId: 'haas', pace: 85, consistency: 82, tyre: 84, wet: 83, feedback: 83, ovr: 83, salary: 0.45, contractEnd: 2026 },
  { id: 'bearman', name: 'Oliver Bearman', cn: '奥利弗·贝尔曼', flag: 'GBR', country: '英国', age: 21, num: 87, teamId: 'haas', pace: 83, consistency: 80, tyre: 81, wet: 81, feedback: 82, ovr: 81, salary: 0.35, contractEnd: 2027 },
  { id: 'hulkenberg', name: 'Nico Hülkenberg', cn: '尼科·霍肯伯格', flag: 'GER', country: '德国', age: 39, num: 27, teamId: 'audi', pace: 85, consistency: 87, tyre: 86, wet: 88, feedback: 91, ovr: 86, salary: 0.40, contractEnd: 2027 },
  { id: 'bortoleto', name: 'Gabriel Bortoleto', cn: '加布里埃尔·博托莱托', flag: 'BRA', country: '巴西', age: 22, num: 5, teamId: 'audi', pace: 82, consistency: 79, tyre: 79, wet: 79, feedback: 78, ovr: 80, salary: 0.30, contractEnd: 2027 },
  { id: 'perez', name: 'Sergio Pérez', cn: '塞尔吉奥·佩雷兹', flag: 'MEX', country: '墨西哥', age: 36, num: 11, teamId: 'cadillac', pace: 85, consistency: 81, tyre: 87, wet: 86, feedback: 85, ovr: 84, salary: 0.65, contractEnd: 2027 },
  { id: 'bottas', name: 'Valtteri Bottas', cn: '瓦尔特利·博塔斯', flag: 'FIN', country: '芬兰', age: 37, num: 77, teamId: 'cadillac', pace: 83, consistency: 83, tyre: 85, wet: 86, feedback: 85, ovr: 83, salary: 0.55, contractEnd: 2027 },

  /* ---------- 2021–2025 official race drivers · free agents ---------- */
  { id: 'ricciardo', name: 'Daniel Ricciardo', cn: '丹尼尔·里卡多', flag: 'AUS', country: '澳大利亚', age: 37, num: 33, teamId: null, pace: 88, consistency: 85, tyre: 89, wet: 88, feedback: 87, ovr: 86, salary: 0.65, freeColor: '#ff8700', pastTeam: 'RB / McLaren' },
  { id: 'tsunoda', name: 'Yuki Tsunoda', cn: '角田裕毅', flag: 'JPN', country: '日本', age: 26, num: 22, teamId: null, pace: 84, consistency: 81, tyre: 82, wet: 83, feedback: 83, ovr: 82, salary: 0.50, freeColor: '#e4e8f2', pastTeam: 'Red Bull / RB' },
  { id: 'vettel', name: 'Sebastian Vettel', cn: '塞巴斯蒂安·维特尔', flag: 'GER', country: '德国', age: 39, num: 5, teamId: null, pace: 84, consistency: 87, tyre: 91, wet: 93, feedback: 96, ovr: 86, salary: 0.75, freeColor: '#006f62', pastTeam: 'Aston Martin / Ferrari' },
  { id: 'raikkonen', name: 'Kimi Räikkönen', cn: '基米·莱科宁', flag: 'FIN', country: '芬兰', age: 47, num: 7, teamId: null, pace: 82, consistency: 83, tyre: 85, wet: 89, feedback: 93, ovr: 84, salary: 0.55, freeColor: '#b30016', pastTeam: 'Alfa Romeo / Ferrari' },
  { id: 'giovinazzi', name: 'Antonio Giovinazzi', cn: '安东尼奥·吉奥维纳兹', flag: 'ITA', country: '意大利', age: 32, num: 99, teamId: null, pace: 78, consistency: 78, tyre: 79, wet: 80, feedback: 79, ovr: 78, salary: 0.25, freeColor: '#a51b22', pastTeam: 'Alfa Romeo' },
  { id: 'kubica', name: 'Robert Kubica', cn: '罗伯特·库比卡', flag: 'POL', country: '波兰', age: 41, num: 88, teamId: null, pace: 73, consistency: 80, tyre: 77, wet: 83, feedback: 88, ovr: 75, salary: 0.20, freeColor: '#8b95a3', pastTeam: 'Alfa Romeo' },
  { id: 'latifi', name: 'Nicholas Latifi', cn: '尼古拉斯·拉提菲', flag: 'CAN', country: '加拿大', age: 31, num: 6, teamId: null, pace: 72, consistency: 74, tyre: 75, wet: 72, feedback: 73, ovr: 72, salary: 0.25, freeColor: '#64c4ff', pastTeam: 'Williams' },
  { id: 'schumacher', name: 'Mick Schumacher', cn: '米克·舒马赫', flag: 'GER', country: '德国', age: 27, num: 47, teamId: null, pace: 79, consistency: 77, tyre: 78, wet: 80, feedback: 78, ovr: 77, salary: 0.30, freeColor: '#b6babd', pastTeam: 'Haas' },
  { id: 'mazepin', name: 'Nikita Mazepin', cn: '尼基塔·马泽平', flag: 'RAF', country: '俄罗斯', age: 27, num: 9, teamId: null, pace: 68, consistency: 67, tyre: 68, wet: 66, feedback: 65, ovr: 66, salary: 0.15, freeColor: '#7d8792', pastTeam: 'Haas' },
  { id: 'zhou', name: 'Guanyu Zhou', cn: '周冠宇', flag: 'CHN', country: '中国', age: 27, num: 24, teamId: null, pace: 78, consistency: 79, tyre: 80, wet: 77, feedback: 79, ovr: 78, salary: 0.30, freeColor: '#00b36b', pastTeam: 'Kick Sauber' },
  { id: 'magnussen', name: 'Kevin Magnussen', cn: '凯文·马格努森', flag: 'DEN', country: '丹麦', age: 34, num: 20, teamId: null, pace: 82, consistency: 79, tyre: 81, wet: 82, feedback: 81, ovr: 81, salary: 0.40, freeColor: '#d7d9dd', pastTeam: 'Haas' },
  { id: 'devries', name: 'Nyck de Vries', cn: '尼克·德弗里斯', flag: 'NED', country: '荷兰', age: 31, num: 21, teamId: null, pace: 77, consistency: 79, tyre: 78, wet: 80, feedback: 81, ovr: 78, salary: 0.25, freeColor: '#4a5b9a', pastTeam: 'AlphaTauri' },
  { id: 'sargeant', name: 'Logan Sargeant', cn: '洛根·萨金特', flag: 'USA', country: '美国', age: 25, num: 2, teamId: null, pace: 73, consistency: 71, tyre: 74, wet: 72, feedback: 71, ovr: 72, salary: 0.20, freeColor: '#3fa9f5', pastTeam: 'Williams' },
  { id: 'doohan', name: 'Jack Doohan', cn: '杰克·杜汉', flag: 'AUS', country: '澳大利亚', age: 23, num: 7, teamId: null, pace: 79, consistency: 75, tyre: 77, wet: 76, feedback: 76, ovr: 77, salary: 0.25, freeColor: '#00a1e8', pastTeam: 'Alpine' }
];

const PHILOSOPHIES = {
  aero: {
    id: 'aero', name: '空力至上', en: 'AERO MAX', glyph: 'A',
    bonus: { aero: 5, chassis: 1, reliability: -2 },
    desc: '把风洞时间全部押在底板与前翼上，用高速弯的绝对下压力建立优势。风险是尾部稳定性。',
    note: '适合：银石、铃鹿、新加坡'
  },
  balanced: {
    id: 'balanced', name: '机械平衡', en: 'BALANCED', glyph: 'B',
    bonus: { aero: 2, chassis: 3, reliability: 1 },
    desc: '没有一项极端，也没有明显短板。让两位车手都能在任何赛道把赛车放进自己的窗口。',
    note: '适合：全年稳定拿分'
  },
  power: {
    id: 'power', name: '直线猎手', en: 'POWER FIRST', glyph: 'P',
    bonus: { power: 5, chassis: -1 },
    desc: '与动力单元供应商深度绑定，把最高尾速做到围场第一。直道上超车，弯道里守线。',
    note: '适合：蒙扎、斯帕、拉斯维加斯'
  },
  reliable: {
    id: 'reliable', name: '可靠第一', en: 'RELIABILITY', glyph: 'R',
    bonus: { reliability: 6, aero: -1 },
    desc: '牺牲一点峰值性能，换取把两台车都带回终点的概率。积分，是给完赛者的奖赏。',
    note: '适合：资源有限、需要稳定拿分'
  }
};

const SPONSORS = [
  {
    id: 'veloce', name: 'VELOCE', cn: '沃洛切能源', role: '冠名赞助商', color: '#ffc24b',
    upfront: 7.0, perRace: 0.55,
    terms: ['赛季末车队进入前三：追加 $10.0M'],
    bonus: { type: 'constructorsTop', pos: 3, amount: 10.0 },
    desc: '围场里最响亮的能源品牌。他们要的不是曝光，是冠军领奖台上的那面背景板。',
    fineprint: '支付周期：签约即付签字费，此后每站结算。'
  },
  {
    id: 'novatech', name: 'NOVA-TECH', cn: '诺瓦科技', role: '技术合作伙伴', color: '#59e6c9',
    upfront: 3.2, perRace: 0.80,
    terms: ['所有研发项目成本降低 20%'],
    bonus: { type: 'rndDiscount', amount: 0.2 },
    desc: '新一代仿真与材料供应商。他们提供的算力与数据，能让每一分研发预算跑得更远。',
    fineprint: '折扣在购买研发项目时自动抵扣。'
  },
  {
    id: 'apexwear', name: 'APEXWEAR', cn: '巅峰潮流', role: '官方商业伙伴', color: '#ff6f9f',
    upfront: 2.0, perRace: 1.00,
    terms: ['每次登上领奖台：额外 $1.0M'],
    bonus: { type: 'podium', amount: 1.0 },
    desc: '年轻化、街头化、全球化的运动品牌。领奖台是他们唯一愿意买单的画面。',
    fineprint: '领奖台奖金在每站比赛结束后结算。'
  }
];

const TRACKS = [
  { id: 'melbourne', round: 1, gp: '澳大利亚站', circuit: '阿尔伯特公园赛道', city: '墨尔本', country: '澳大利亚', date: '3月6–8日', sprint: false, lengthKm: 5.278, laps: 58, corners: 14, direction: '顺时针', type: '半街道赛道', baseLap: 75.2, power: 0.45, df: 0.68, tyre: 0.55, rain: 0.25, desc: '湖景半街道赛道，中高速弯与制动稳定性并重。2026 新规的直道模式会放大出弯牵引力的价值。' },
  { id: 'shanghai', round: 2, gp: '中国站', circuit: '上海国际赛车场', city: '上海', country: '中国', date: '3月13–15日', sprint: true, lengthKm: 5.451, laps: 56, corners: 16, direction: '顺时针', type: '永久赛道', baseLap: 90.8, power: 0.72, df: 0.52, tyre: 0.62, rain: 0.35, desc: '1.2 公里超长直道接螺旋式发夹弯，对动力、机械平衡与后轮管理提出三重考验。' },
  { id: 'suzuka', round: 3, gp: '日本站', circuit: '铃鹿国际赛车场', city: '铃鹿', country: '日本', date: '3月27–29日', sprint: false, lengthKm: 5.807, laps: 53, corners: 18, direction: '8字形', type: '永久赛道', baseLap: 87.0, power: 0.62, df: 0.90, tyre: 0.72, rain: 0.45, desc: 'F1 唯一的 8 字形布局。S 弯、Spoon 与 130R 连续要求下压力与车手胆量。' },
  { id: 'bahrain', round: 4, gp: '巴林站', circuit: '巴林国际赛道', city: '萨基尔', country: '巴林', date: '4月10–12日', sprint: false, lengthKm: 5.412, laps: 57, corners: 15, direction: '顺时针', type: '永久赛道', baseLap: 89.9, power: 0.74, df: 0.55, tyre: 0.75, rain: 0.02, desc: '沙漠夜赛，牵引力与后轮管理是核心。重刹区的稳定性决定车手能否守住位置。' },
  { id: 'jeddah', round: 5, gp: '沙特阿拉伯站', circuit: '吉达滨海街道赛道', city: '吉达', country: '沙特阿拉伯', date: '4月17–19日', sprint: false, lengthKm: 6.174, laps: 50, corners: 27, direction: '逆时针', type: '街道赛道', baseLap: 87.4, power: 0.90, df: 0.50, tyre: 0.65, rain: 0.02, desc: '赛历最快的街道赛。27 个弯角贴墙而过，高速连续弯让任何误差都被放大。' },
  { id: 'miami', round: 6, gp: '迈阿密站', circuit: '迈阿密国际赛车场', city: '迈阿密', country: '美国', date: '5月1–3日', sprint: true, lengthKm: 5.412, laps: 57, corners: 19, direction: '逆时针', type: '半街道赛道', baseLap: 86.4, power: 0.70, df: 0.62, tyre: 0.65, rain: 0.35, desc: '围绕硬石体育场铺设的半街道赛道，长直道与低速复合弯并存，制动稳定性格外重要。' },
  { id: 'canada', round: 7, gp: '加拿大站', circuit: '吉尔·维伦纽夫赛道', city: '蒙特利尔', country: '加拿大', date: '5月22–24日', sprint: true, lengthKm: 4.361, laps: 70, corners: 14, direction: '顺时针', type: '半街道赛道', baseLap: 70.9, power: 0.68, df: 0.55, tyre: 0.55, rain: 0.35, desc: '圣劳伦斯河上的半街道赛道。重刹入弯与出弯牵引力决定圈速，安全车出现概率很高。' },
  { id: 'monaco', round: 8, gp: '摩纳哥站', circuit: '蒙特卡洛街道赛道', city: '蒙特卡洛', country: '摩纳哥', date: '6月5–7日', sprint: false, lengthKm: 3.337, laps: 78, corners: 19, direction: '顺时针', type: '街道赛道', baseLap: 70.0, power: 0.15, df: 0.98, tyre: 0.35, rain: 0.20, desc: '围栏近在咫尺，下压力就是全部。排位赛几乎决定比赛，超车只存在于策略中。' },
  { id: 'barcelona', round: 9, gp: '巴塞罗那站', circuit: '巴塞罗那-加泰罗尼亚赛道', city: '巴塞罗那', country: '西班牙', date: '6月12–14日', sprint: false, lengthKm: 4.657, laps: 66, corners: 14, direction: '顺时针', type: '永久赛道', baseLap: 71.6, power: 0.60, df: 0.85, tyre: 0.78, rain: 0.15, desc: '经典的综合测试场。高速弯与长距离节奏同时考验空气效率、机械平衡和轮胎管理。' },
  { id: 'austria', round: 10, gp: '奥地利站', circuit: '红牛环赛道', city: '施皮尔贝格', country: '奥地利', date: '6月26–28日', sprint: false, lengthKm: 4.318, laps: 71, corners: 10, direction: '顺时针', type: '永久赛道', baseLap: 64.0, power: 0.72, df: 0.62, tyre: 0.65, rain: 0.35, desc: '短小起伏的红牛环只有十个弯角，却能把动力、制动和轮胎的差距迅速放大。' },
  { id: 'silverstone', round: 11, gp: '英国站', circuit: '银石赛道', city: '银石', country: '英国', date: '7月3–5日', sprint: true, lengthKm: 5.891, laps: 52, corners: 18, direction: '顺时针', type: '永久赛道', baseLap: 85.0, power: 0.68, df: 0.88, tyre: 0.82, rain: 0.50, desc: '高速连续弯的圣地。Copse-Maggotts-Becketts 一段同时要求下压力、线路精度与勇气。' },
  { id: 'spa', round: 12, gp: '比利时站', circuit: '斯帕-弗朗科尔尚赛道', city: '斯帕', country: '比利时', date: '7月17–19日', sprint: false, lengthKm: 7.004, laps: 44, corners: 19, direction: '顺时针', type: '永久赛道', baseLap: 101.0, power: 0.90, df: 0.65, tyre: 0.70, rain: 0.60, desc: '赛历最长的赛道。Eau Rouge 与超长直道并存，局部降雨随时可能重写比赛策略。' },
  { id: 'hungary', round: 13, gp: '匈牙利站', circuit: '亨格罗林赛道', city: '布达佩斯', country: '匈牙利', date: '7月24–26日', sprint: false, lengthKm: 4.381, laps: 70, corners: 14, direction: '顺时针', type: '永久赛道', baseLap: 75.4, power: 0.35, df: 0.92, tyre: 0.65, rain: 0.30, desc: '低速、高下压力、难超车。排位赛和策略窗口比绝对速度更重要，耐心是最稀缺的资源。' },
  { id: 'zandvoort', round: 14, gp: '荷兰站', circuit: '赞德沃特赛道', city: '赞德沃特', country: '荷兰', date: '8月21–23日', sprint: true, lengthKm: 4.259, laps: 72, corners: 14, direction: '顺时针', type: '永久赛道', baseLap: 68.8, power: 0.45, df: 0.92, tyre: 0.70, rain: 0.40, desc: '沙丘中的过山车赛道，倾斜弯角带来连续高载荷。赛道窄、超车少，信心决定一切。' },
  { id: 'monza', round: 15, gp: '意大利站', circuit: '蒙扎国家赛车场', city: '蒙扎', country: '意大利', date: '9月4–6日', sprint: false, lengthKm: 5.793, laps: 53, corners: 11, direction: '顺时针', type: '永久赛道', baseLap: 79.0, power: 0.98, df: 0.22, tyre: 0.55, rain: 0.20, desc: '速度神殿。低阻套件、最高尾速与重刹稳定性；在这里，多余的下压力都是负担。' },
  { id: 'madrid', round: 16, gp: '马德里站', circuit: '马德里环赛道', city: '马德里', country: '西班牙', date: '9月11–13日', sprint: false, lengthKm: 5.414, laps: 57, corners: 22, direction: '顺时针', type: '半街道赛道', baseLap: 91.5, power: 0.70, df: 0.75, tyre: 0.80, rain: 0.10, desc: 'IFEMA 会展区周边的新半街道赛道。22 个弯角与长倾斜弯让模拟数据第一次接受真实检验。' },
  { id: 'baku', round: 17, gp: '阿塞拜疆站', circuit: '巴库城市赛道', city: '巴库', country: '阿塞拜疆', date: '9月25–27日', sprint: false, lengthKm: 6.003, laps: 51, corners: 20, direction: '逆时针', type: '街道赛道', baseLap: 101.6, power: 0.86, df: 0.42, tyre: 0.50, rain: 0.10, desc: '城堡路段的狭窄弯角与超长直道形成极端反差。制动稳定性和轮胎升温是胜负手。' },
  { id: 'singapore', round: 18, gp: '新加坡站', circuit: '滨海湾街道赛道', city: '新加坡', country: '新加坡', date: '10月9–11日', sprint: true, lengthKm: 4.940, laps: 62, corners: 19, direction: '逆时针', type: '街道赛道', baseLap: 89.6, power: 0.35, df: 0.95, tyre: 0.75, rain: 0.30, desc: '湿热夜战，墙壁与路肩都在等待失误。安全车几乎必然出现，策略窗口会被彻底打乱。' },
  { id: 'austin', round: 19, gp: '美国站', circuit: '美洲赛道', city: '奥斯汀', country: '美国', date: '10月23–25日', sprint: false, lengthKm: 5.513, laps: 56, corners: 20, direction: '逆时针', type: '永久赛道', baseLap: 92.5, power: 0.72, df: 0.75, tyre: 0.70, rain: 0.25, desc: '第一弯陡坡重刹是标志性画面，连续复合弯又要求赛车平衡。节奏一旦丢失很难找回。' },
  { id: 'mexico', round: 20, gp: '墨西哥城站', circuit: '罗德里格斯兄弟赛道', city: '墨西哥城', country: '墨西哥', date: '10月30日–11月1日', sprint: false, lengthKm: 4.304, laps: 71, corners: 17, direction: '顺时针', type: '永久赛道', baseLap: 75.6, power: 0.80, df: 0.60, tyre: 0.55, rain: 0.20, desc: '高海拔稀薄空气削弱下压力与冷却效率，长直道让低阻调校得到巨大回报。' },
  { id: 'brazil', round: 21, gp: '圣保罗站', circuit: '若泽·卡洛斯·帕塞赛道', city: '圣保罗', country: '巴西', date: '11月6–8日', sprint: false, lengthKm: 4.309, laps: 71, corners: 15, direction: '逆时针', type: '永久赛道', baseLap: 69.8, power: 0.65, df: 0.70, tyre: 0.65, rain: 0.45, desc: '英特拉格斯短小紧凑，海拔起伏与多变天气让比赛永远不缺戏剧性。' },
  { id: 'lasvegas', round: 22, gp: '拉斯维加斯站', circuit: '拉斯维加斯大道赛道', city: '拉斯维加斯', country: '美国', date: '11月19–21日', sprint: false, lengthKm: 6.201, laps: 50, corners: 17, direction: '逆时针', type: '街道赛道', baseLap: 92.0, power: 0.95, df: 0.28, tyre: 0.35, rain: 0.05, desc: '低温夜赛与超长直道。轮胎升温困难，低阻调校成为唯一选择，刹车区是少数超车窗口。' },
  { id: 'qatar', round: 23, gp: '卡塔尔站', circuit: '卢赛尔国际赛道', city: '卢赛尔', country: '卡塔尔', date: '11月27–29日', sprint: false, lengthKm: 5.419, laps: 57, corners: 16, direction: '顺时针', type: '永久赛道', baseLap: 80.0, power: 0.76, df: 0.78, tyre: 0.80, rain: 0.02, desc: '高速流畅的沙漠夜赛，高载荷弯角让轮胎成为最稀缺的资源，进站窗口极难拿捏。' },
  { id: 'abudhabi', round: 24, gp: '阿布扎比站', circuit: '亚斯码头赛道', city: '阿布扎比', country: '阿联酋', date: '12月4–6日', sprint: false, lengthKm: 5.281, laps: 58, corners: 16, direction: '逆时针', type: '永久赛道', baseLap: 82.5, power: 0.55, df: 0.72, tyre: 0.55, rain: 0.02, desc: '收官夜的亚斯码头。低速弯接长直道，稳定拿分有时比冒险争冠更重要。' }
];

const TYRES = {
  soft: { id: 'soft', name: '软胎', short: 'S', color: '#ff5a67', offset: -0.38, deg: 0.075, rain: false, note: '最快单圈，寿命最短' },
  medium: { id: 'medium', name: '中性胎', short: 'M', color: '#ffd857', offset: 0, deg: 0.052, rain: false, note: '速度与寿命的平衡点' },
  hard: { id: 'hard', name: '硬胎', short: 'H', color: '#edf3fb', offset: 0.32, deg: 0.036, rain: false, note: '更长的第一段，适合高胎耗赛道' },
  wet: { id: 'wet', name: '半雨胎', short: 'I', color: '#42d28a', offset: 0, deg: 0.048, rain: true, note: '潮湿与中雨，兼顾排水与胎温' },
  fullwet: { id: 'fullwet', name: '全雨胎', short: 'W', color: '#4f8dff', offset: 0, deg: 0.042, rain: true, note: '暴雨与积水路面，最大排水量' }
};



const RND_BRANCHES = [
  { id: 'aero', name: '空气动力学', en: 'AERO', code: 'A', focus: 'aero', color: '#63b8ff', desc: '前后翼、底板与整车气动效率。风险：部件振动与气流失稳。' },
  { id: 'chassis', name: '底盘与机械', en: 'CHASSIS', code: 'C', focus: 'chassis', color: '#ffc857', desc: '悬挂、重量分布与机械抓地。风险：结构疲劳与调校窗口收窄。' },
  { id: 'power', name: '动力单元', en: 'POWER UNIT', code: 'P', focus: 'power', color: '#ff6f7d', desc: '燃烧、ERS 与能量部署。风险：热管理与机械故障。' },
  { id: 'reliability', name: '可靠性与耐久', en: 'RELIABILITY', code: 'R', focus: 'reliability', color: '#42e0a5', desc: '液压、变速箱与系统冗余。可降低性能升级带来的退赛风险。' }
];

const RND_NODES = [
  { id: 'aero-1', branch: 'aero', tier: 1, name: '前翼端板', en: 'FRONT WING', cost: 3.6, rounds: 1, effects: { aero: 2 }, devRisk: 0.03, riskDelta: 0.4, requires: [], desc: '重新塑形前翼端板，改善前轴响应与高速弯气动稳定性。' },
  { id: 'aero-2', branch: 'aero', tier: 2, name: '底板涡流通道', en: 'FLOOR VORTEX', cost: 5.0, rounds: 1, effects: { aero: 2, chassis: 1 }, devRisk: 0.06, riskDelta: 0.6, requires: ['aero-1'], desc: '重做底板边缘与涡流发生器，在低离地间隙下稳定下压力。' },
  { id: 'aero-3', branch: 'aero', tier: 3, name: 'B-Spec 空力套件', en: 'B-SPEC AERO', cost: 7.0, rounds: 2, effects: { aero: 3 }, devRisk: 0.10, riskDelta: 1.0, requires: ['aero-2'], desc: '完整前翼、底板与尾翼套件，赛季后半程的峰值性能升级。' },
  { id: 'chassis-1', branch: 'chassis', tier: 1, name: '悬挂几何', en: 'SUSPENSION', cost: 3.4, rounds: 1, effects: { chassis: 2 }, devRisk: 0.03, riskDelta: 0.3, requires: [], desc: '调整前后悬挂几何，扩大机械抓地与轮胎工作窗口。' },
  { id: 'chassis-2', branch: 'chassis', tier: 2, name: '轻量化座舱', en: 'LIGHTWEIGHT', cost: 4.8, rounds: 1, effects: { chassis: 1, aero: 1 }, devRisk: 0.06, riskDelta: 0.5, requires: ['chassis-1'], desc: '更换复合材料结构件，降低重心并释放额外的配重空间。' },
  { id: 'chassis-3', branch: 'chassis', tier: 3, name: '主动底盘平台', en: 'ADAPTIVE CHASSIS', cost: 6.8, rounds: 2, effects: { chassis: 3 }, devRisk: 0.10, riskDelta: 0.9, requires: ['chassis-2'], desc: '与 2026 主动空气动力学协同的底盘控制逻辑，提升全赛道适应性。' },
  { id: 'power-1', branch: 'power', tier: 1, name: '燃烧室优化', en: 'COMBUSTION', cost: 4.0, rounds: 1, effects: { power: 2 }, devRisk: 0.04, riskDelta: 0.8, requires: [], desc: '提高燃烧效率与油门响应，带来更直接的出弯动力。' },
  { id: 'power-2', branch: 'power', tier: 2, name: 'ERS 能量回收', en: 'ERS MAP', cost: 5.4, rounds: 1, effects: { power: 2 }, devRisk: 0.07, riskDelta: 1.0, requires: ['power-1'], desc: '重新标定能量回收与部署曲线，提高单圈与防守能力。' },
  { id: 'power-3', branch: 'power', tier: 3, name: '动力单元 Evo', en: 'POWER EVO', cost: 7.4, rounds: 2, effects: { power: 3 }, devRisk: 0.12, riskDelta: 1.5, requires: ['power-2'], desc: '新一代燃烧室与能量管理软件，最大胆也最脆弱的一步。' },
  { id: 'reliability-1', branch: 'reliability', tier: 1, name: '液压系统强化', en: 'HYDRAULICS', cost: 2.8, rounds: 1, effects: { reliability: 4 }, devRisk: 0.01, riskDelta: -0.8, requires: [], desc: '提高液压管路与作动器冗余，降低机械故障概率。' },
  { id: 'reliability-2', branch: 'reliability', tier: 2, name: '变速箱耐久', en: 'GEARBOX', cost: 4.2, rounds: 1, effects: { reliability: 4 }, devRisk: 0.02, riskDelta: -0.9, requires: ['reliability-1'], desc: '延长变速箱与离合器寿命，让激进策略更有底气。' },
  { id: 'reliability-3', branch: 'reliability', tier: 3, name: '全系统韧性验证', en: 'SYSTEMS CHECK', cost: 5.6, rounds: 2, effects: { reliability: 4 }, devRisk: 0.01, riskDelta: -1.2, requires: ['reliability-2'], desc: '完成全车热、振、电系统联合验证，抵消性能升级的故障风险。' }
];

const POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
const PRIZE = [2.8, 2.2, 1.7, 1.4, 1.15, 0.95, 0.8, 0.65, 0.55, 0.45, 0.35, 0.3, 0.25, 0.22, 0.2, 0.18, 0.16, 0.14, 0.12, 0.1, 0.08, 0.06];
const BOARD_DELTAS = { great: 8, good: 4, ok: 1, poor: -3, bad: -6, dnf: -8 };

const TRACK_POOL = [...TRACKS, ...HISTORIC_TRACKS];
const TEAM_MAP = Object.fromEntries(TEAMS.map((t) => [t.id, t]));
const DRIVER_MAP = Object.fromEntries(DRIVERS.map((d) => [d.id, d]));
const TRACK_MAP = Object.fromEntries(TRACK_POOL.map((t) => [t.id, t]));
const SPONSOR_MAP = Object.fromEntries(SPONSORS.map((s) => [s.id, s]));
const RND_NODE_MAP = Object.fromEntries(RND_NODES.map((node) => [node.id, node]));
const RND_BRANCH_MAP = Object.fromEntries(RND_BRANCHES.map((branch) => [branch.id, branch]));

const CAR_STAT_LABELS = { aero: '空气动力学', chassis: '机械抓地', power: '动力单元', reliability: '可靠性' };
const CAR_STAT_SHORT = { aero: 'AERO', chassis: 'CHS', power: 'PWR', reliability: 'REL' };
const DRIVER_STAT_LABELS = { pace: '速度', consistency: '稳定', tyre: '保胎', wet: '雨战', feedback: '反馈' };
const RACECRAFT_LABELS = { overtake: '超车', follow: '跟车', defend: '防守' };
