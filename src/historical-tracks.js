/* ============================================================
   HISTORIC F1 CIRCUITS — 曾出现在 F1 赛历上的经典赛道
   数值为玩法模型；单圈长度/弯角参考各赛道历史配置。
   ============================================================ */

const HISTORIC_TRACKS = [
  {
    id: 'nurburgring', gp: '纽博格林站', circuit: '纽博格林大奖赛赛道', city: '尼尔堡', country: '德国',
    date: '经典赛历', sprint: false, legacy: true, era: '1950s–2010s',
    lengthKm: 5.148, laps: 60, corners: 15, direction: '顺时针', type: '永久赛道',
    baseLap: 91.5, power: 0.62, df: 0.78, tyre: 0.62, rain: 0.38,
    desc: '绿色地狱旁的现代大奖赛赛道，起伏与高速弯考验底盘信心。'
  },
  {
    id: 'hockenheim', gp: '霍根海姆站', circuit: '霍根海姆环', city: '霍根海姆', country: '德国',
    date: '经典赛历', sprint: false, legacy: true, era: '1970s–2019',
    lengthKm: 4.574, laps: 67, corners: 17, direction: '顺时针', type: '永久赛道',
    baseLap: 77.0, power: 0.80, df: 0.52, tyre: 0.55, rain: 0.35,
    desc: '森林直道与体育场弯的组合，低下压力与重刹是关键词。'
  },
  {
    id: 'imola', gp: '伊莫拉站', circuit: '恩佐与迪诺·法拉利国际赛道', city: '伊莫拉', country: '意大利',
    date: '经典赛历', sprint: false, legacy: true, era: '1980s–2020s',
    lengthKm: 4.909, laps: 63, corners: 19, direction: '逆时针', type: '永久赛道',
    baseLap: 78.5, power: 0.58, df: 0.82, tyre: 0.60, rain: 0.35,
    desc: '老派赛道，几乎没有缓冲区，排位与刹车稳定性决定一切。'
  },
  {
    id: 'mugello', gp: '穆杰罗站', circuit: '穆杰罗赛道', city: '斯卡尔佩里亚', country: '意大利',
    date: '经典赛历', sprint: false, legacy: true, era: '2020',
    lengthKm: 5.245, laps: 59, corners: 15, direction: '顺时针', type: '永久赛道',
    baseLap: 80.5, power: 0.72, df: 0.82, tyre: 0.78, rain: 0.30,
    desc: '高速连续弯与长直道，轮胎承受全年最高载荷之一。'
  },
  {
    id: 'portimao', gp: '波尔蒂芒站', circuit: '阿尔加维国际赛道', city: '波尔蒂芒', country: '葡萄牙',
    date: '经典赛历', sprint: false, legacy: true, era: '2020–2021',
    lengthKm: 4.653, laps: 66, corners: 15, direction: '顺时针', type: '永久赛道',
    baseLap: 78.0, power: 0.55, df: 0.76, tyre: 0.70, rain: 0.25,
    desc: '过山车般的起伏，抓地力与轮胎升温是最大变数。'
  },
  {
    id: 'istanbul', gp: '伊斯坦布尔站', circuit: '伊斯坦布尔公园', city: '伊斯坦布尔', country: '土耳其',
    date: '经典赛历', sprint: false, legacy: true, era: '2005–2021',
    lengthKm: 5.338, laps: 58, corners: 14, direction: '逆时针', type: '永久赛道',
    baseLap: 87.5, power: 0.67, df: 0.78, tyre: 0.70, rain: 0.25,
    desc: '8 号弯的四顶点长弯，要求前后轴完美平衡。'
  },
  {
    id: 'sepang', gp: '雪邦站', circuit: '雪邦国际赛车场', city: '吉隆坡', country: '马来西亚',
    date: '经典赛历', sprint: false, legacy: true, era: '1999–2017',
    lengthKm: 5.543, laps: 56, corners: 15, direction: '顺时针', type: '永久赛道',
    baseLap: 94.0, power: 0.72, df: 0.82, tyre: 0.78, rain: 0.55,
    desc: '高温高湿与两条长直道，轮胎与冷却系统同时承压。'
  },
  {
    id: 'fuji', gp: '富士站', circuit: '富士国际赛车场', city: '富士山', country: '日本',
    date: '经典赛历', sprint: false, legacy: true, era: '1976–2008',
    lengthKm: 4.563, laps: 67, corners: 16, direction: '顺时针', type: '永久赛道',
    baseLap: 80.0, power: 0.74, df: 0.82, tyre: 0.68, rain: 0.50,
    desc: '富士山下的长直道与高速弯，天气变化往往重写比赛。'
  },
  {
    id: 'sochi', gp: '索契站', circuit: '索契国际街道赛道', city: '索契', country: '俄罗斯',
    date: '经典赛历', sprint: false, legacy: true, era: '2014–2021',
    lengthKm: 5.848, laps: 53, corners: 18, direction: '顺时针', type: '街道赛道',
    baseLap: 95.0, power: 0.70, df: 0.60, tyre: 0.52, rain: 0.20,
    desc: '奥运公园街道赛，长直道后接大量 90 度弯。'
  },
  {
    id: 'yeongam', gp: '韩国站', circuit: '韩国国际赛车场', city: '灵岩', country: '韩国',
    date: '经典赛历', sprint: false, legacy: true, era: '2010–2013',
    lengthKm: 5.615, laps: 55, corners: 18, direction: '逆时针', type: '半街道赛道',
    baseLap: 98.0, power: 0.72, df: 0.64, tyre: 0.56, rain: 0.30,
    desc: '海港边的长直道与低速复合弯，超车窗口清晰。'
  },
  {
    id: 'buddh', gp: '印度站', circuit: '佛陀国际赛车场', city: '大诺伊达', country: '印度',
    date: '经典赛历', sprint: false, legacy: true, era: '2011–2013',
    lengthKm: 5.125, laps: 60, corners: 16, direction: '顺时针', type: '永久赛道',
    baseLap: 87.0, power: 0.74, df: 0.70, tyre: 0.62, rain: 0.20,
    desc: '长直道与连续高速弯，刹车稳定性是关键。'
  },
  {
    id: 'valencia', gp: '瓦伦西亚站', circuit: '瓦伦西亚街道赛道', city: '瓦伦西亚', country: '西班牙',
    date: '经典赛历', sprint: false, legacy: true, era: '2008–2012',
    lengthKm: 5.419, laps: 57, corners: 25, direction: '顺时针', type: '街道赛道',
    baseLap: 99.0, power: 0.62, df: 0.72, tyre: 0.52, rain: 0.15,
    desc: '港口街道赛，慢弯多、超车难，排位价值极高。'
  },
  {
    id: 'jerez', gp: '赫雷斯站', circuit: '赫雷斯赛道', city: '赫雷斯', country: '西班牙',
    date: '经典赛历', sprint: false, legacy: true, era: '1986–1997',
    lengthKm: 4.428, laps: 69, corners: 13, direction: '顺时针', type: '永久赛道',
    baseLap: 78.0, power: 0.50, df: 0.75, tyre: 0.65, rain: 0.20,
    desc: '短小紧凑，低速弯与后轮牵引力决定圈速。'
  },
  {
    id: 'magnycours', gp: '马尼库尔站', circuit: '马尼库尔赛道', city: '讷韦尔', country: '法国',
    date: '经典赛历', sprint: false, legacy: true, era: '1991–2008',
    lengthKm: 4.411, laps: 70, corners: 17, direction: '顺时针', type: '永久赛道',
    baseLap: 75.5, power: 0.56, df: 0.78, tyre: 0.58, rain: 0.30,
    desc: '流畅的连续弯与阿德莱德弯发夹，机械抓地力优先。'
  },
  {
    id: 'paulricard', gp: '保罗·里卡德站', circuit: '保罗·里卡德赛道', city: '勒卡斯特莱', country: '法国',
    date: '经典赛历', sprint: false, legacy: true, era: '1971–2022',
    lengthKm: 5.842, laps: 53, corners: 15, direction: '顺时针', type: '永久赛道',
    baseLap: 92.0, power: 0.84, df: 0.62, tyre: 0.55, rain: 0.20,
    desc: '开阔的蓝线赛道，长直道与宽弯角让策略空间很大。'
  },
  {
    id: 'estoril', gp: '埃什托里尔站', circuit: '埃什托里尔赛道', city: '埃什托里尔', country: '葡萄牙',
    date: '经典赛历', sprint: false, legacy: true, era: '1984–1996',
    lengthKm: 4.360, laps: 71, corners: 13, direction: '顺时针', type: '永久赛道',
    baseLap: 80.0, power: 0.66, df: 0.62, tyre: 0.55, rain: 0.25,
    desc: '最后一个长右弯与低速发夹，轮胎升温偏慢。'
  },
  {
    id: 'brandshatch', gp: '布兰兹哈奇站', circuit: '布兰兹哈奇赛道', city: '肯特', country: '英国',
    date: '经典赛历', sprint: false, legacy: true, era: '1964–1986',
    lengthKm: 3.703, laps: 76, corners: 9, direction: '顺时针', type: '永久赛道',
    baseLap: 71.0, power: 0.58, df: 0.78, tyre: 0.60, rain: 0.45,
    desc: '起伏剧烈的短赛道，Paddock Hill 与高速弯考验胆量。'
  },
  {
    id: 'donington', gp: '多宁顿公园站', circuit: '多宁顿公园赛道', city: '莱斯特郡', country: '英国',
    date: '经典赛历', sprint: false, legacy: true, era: '1993',
    lengthKm: 4.020, laps: 76, corners: 12, direction: '顺时针', type: '永久赛道',
    baseLap: 73.0, power: 0.60, df: 0.72, tyre: 0.60, rain: 0.45,
    desc: '欧洲站经典一役的举办地，雨天与起伏让差距被放大。'
  },
  {
    id: 'zolder', gp: '佐尔德站', circuit: '佐尔德赛道', city: '亨克', country: '比利时',
    date: '经典赛历', sprint: false, legacy: true, era: '1973–1984',
    lengthKm: 4.262, laps: 70, corners: 10, direction: '顺时针', type: '永久赛道',
    baseLap: 78.0, power: 0.62, df: 0.60, tyre: 0.55, rain: 0.35,
    desc: '紧凑的比利时赛道，慢弯出弯牵引力决定一切。'
  },
  {
    id: 'anderstorp', gp: '安德斯托普站', circuit: '斯堪的纳维亚赛道', city: '安德斯托普', country: '瑞典',
    date: '经典赛历', sprint: false, legacy: true, era: '1973–1978',
    lengthKm: 4.025, laps: 72, corners: 8, direction: '顺时针', type: '永久赛道',
    baseLap: 78.0, power: 0.68, df: 0.55, tyre: 0.55, rain: 0.30,
    desc: '北欧森林中的低速赛道，直道与简单弯角考验机械效率。'
  },
  {
    id: 'kyalami', gp: '卡拉米站', circuit: '卡拉米大奖赛赛道', city: '米德兰', country: '南非',
    date: '经典赛历', sprint: false, legacy: true, era: '1967–1993',
    lengthKm: 4.261, laps: 72, corners: 16, direction: '逆时针', type: '永久赛道',
    baseLap: 78.0, power: 0.74, df: 0.60, tyre: 0.58, rain: 0.15,
    desc: '高原稀薄空气与长直道，动力与刹车稳定性并重。'
  },
  {
    id: 'watkinsglen', gp: '沃特金斯格伦站', circuit: '沃特金斯格伦国际', city: '纽约州', country: '美国',
    date: '经典赛历', sprint: false, legacy: true, era: '1961–1980',
    lengthKm: 5.435, laps: 59, corners: 11, direction: '顺时针', type: '永久赛道',
    baseLap: 100.0, power: 0.82, df: 0.62, tyre: 0.55, rain: 0.30,
    desc: '美国经典高速赛道，长弯与直道让勇气比下压力更重要。'
  },
  {
    id: 'longbeach', gp: '长滩站', circuit: '长滩街道赛道', city: '长滩', country: '美国',
    date: '经典赛历', sprint: false, legacy: true, era: '1976–1983',
    lengthKm: 3.275, laps: 75, corners: 11, direction: '顺时针', type: '街道赛道',
    baseLap: 78.0, power: 0.56, df: 0.72, tyre: 0.48, rain: 0.10,
    desc: '海滨街道赛，墙壁与低速弯几乎没有犯错空间。'
  },
  {
    id: 'detroit', gp: '底特律站', circuit: '底特律街道赛道', city: '底特律', country: '美国',
    date: '经典赛历', sprint: false, legacy: true, era: '1982–1988',
    lengthKm: 4.023, laps: 63, corners: 17, direction: '顺时针', type: '街道赛道',
    baseLap: 85.0, power: 0.58, df: 0.72, tyre: 0.48, rain: 0.20,
    desc: '水泥墙包围的城市赛道，低速弯与刹车稳定性是核心。'
  },
  {
    id: 'adelaide', gp: '阿德莱德站', circuit: '阿德莱德街道赛道', city: '阿德莱德', country: '澳大利亚',
    date: '经典赛历', sprint: false, legacy: true, era: '1985–1995',
    lengthKm: 3.780, laps: 81, corners: 16, direction: '逆时针', type: '街道赛道',
    baseLap: 75.0, power: 0.56, df: 0.70, tyre: 0.50, rain: 0.15,
    desc: '赛季收官经典地，狭窄街道与长直道形成鲜明反差。'
  },
  {
    id: 'buenosaires', gp: '布宜诺斯艾利斯站', circuit: '奥斯卡·阿尔弗雷多·加尔韦斯赛道', city: '布宜诺斯艾利斯', country: '阿根廷',
    date: '经典赛历', sprint: false, legacy: true, era: '1953–1998',
    lengthKm: 5.968, laps: 53, corners: 15, direction: '顺时针', type: '永久赛道',
    baseLap: 100.0, power: 0.78, df: 0.60, tyre: 0.55, rain: 0.20,
    desc: '南美经典赛道，高速与重刹交替，轮胎负担很大。'
  },
  {
    id: 'jacarepagua', gp: '雅卡雷帕瓜站', circuit: '尼尔森·皮奎特赛道', city: '里约热内卢', country: '巴西',
    date: '经典赛历', sprint: false, legacy: true, era: '1978–1989',
    lengthKm: 5.031, laps: 61, corners: 11, direction: '顺时针', type: '永久赛道',
    baseLap: 92.0, power: 0.82, df: 0.55, tyre: 0.50, rain: 0.35,
    desc: '高温与高速弯，右后胎是整场比赛的瓶颈。'
  },
  {
    id: 'montjuic', gp: '蒙锥克山站', circuit: '蒙锥克公园赛道', city: '巴塞罗那', country: '西班牙',
    date: '经典赛历', sprint: false, legacy: true, era: '1969–1975',
    lengthKm: 3.791, laps: 75, corners: 13, direction: '顺时针', type: '街道赛道',
    baseLap: 85.0, power: 0.48, df: 0.75, tyre: 0.50, rain: 0.15,
    desc: '山丘公园中的老派街道赛，坡度与护栏极具挑战。'
  },
  {
    id: 'jarama', gp: '哈拉马站', circuit: '哈拉马赛道', city: '马德里', country: '西班牙',
    date: '经典赛历', sprint: false, legacy: true, era: '1968–1981',
    lengthKm: 3.404, laps: 80, corners: 13, direction: '顺时针', type: '永久赛道',
    baseLap: 80.0, power: 0.52, df: 0.72, tyre: 0.50, rain: 0.15,
    desc: '短促的技术型赛道，排位赛几乎决定最终顺序。'
  },
  {
    id: 'aintree', gp: '安特里站', circuit: '安特里赛道', city: '利物浦', country: '英国',
    date: '经典赛历', sprint: false, legacy: true, era: '1955–1962',
    lengthKm: 4.828, laps: 75, corners: 10, direction: '顺时针', type: '永久赛道',
    baseLap: 105.0, power: 0.66, df: 0.60, tyre: 0.50, rain: 0.40,
    desc: '英国经典高速赛道，长直道与快速弯角考验稳定性。'
  },
  {
    id: 'rouen', gp: '鲁昂站', circuit: '鲁昂-莱塞萨尔赛道', city: '鲁昂', country: '法国',
    date: '经典赛历', sprint: false, legacy: true, era: '1952–1968',
    lengthKm: 6.542, laps: 55, corners: 13, direction: '顺时针', type: '永久赛道',
    baseLap: 130.0, power: 0.76, df: 0.68, tyre: 0.50, rain: 0.35,
    desc: '法国长赛道，长弯与下坡刹车让车手必须精准。'
  },
  {
    id: 'clermont', gp: '克莱蒙费朗站', circuit: '沙勒德孔布赛道', city: '克莱蒙费朗', country: '法国',
    date: '经典赛历', sprint: false, legacy: true, era: '1958–1972',
    lengthKm: 8.055, laps: 42, corners: 27, direction: '顺时针', type: '永久赛道',
    baseLap: 155.0, power: 0.66, df: 0.72, tyre: 0.45, rain: 0.30,
    desc: '火山地形中的超长赛道，连续弯与高差考验底盘。'
  },
  {
    id: 'reims', gp: '兰斯站', circuit: '兰斯-格克斯赛道', city: '兰斯', country: '法国',
    date: '经典赛历', sprint: false, legacy: true, era: '1950–1966',
    lengthKm: 8.302, laps: 48, corners: 9, direction: '顺时针', type: '永久赛道',
    baseLap: 145.0, power: 0.96, df: 0.30, tyre: 0.40, rain: 0.25,
    desc: '三条长直道组成的速度殿堂，低下压力与尾速至上。'
  },
  {
    id: 'pescara', gp: '佩斯卡拉站', circuit: '佩斯卡拉赛道', city: '佩斯卡拉', country: '意大利',
    date: '经典赛历', sprint: false, legacy: true, era: '1957',
    lengthKm: 25.579, laps: 18, corners: 30, direction: '顺时针', type: '公路赛道',
    baseLap: 580.0, power: 0.95, df: 0.35, tyre: 0.35, rain: 0.25,
    desc: 'F1 史上最长的赛道之一，25 公里一圈，耐力与胆量并重。'
  },
  {
    id: 'bremgarten', gp: '布雷姆加滕站', circuit: '布雷姆加滕赛道', city: '伯尔尼', country: '瑞士',
    date: '经典赛历', sprint: false, legacy: true, era: '1950–1954',
    lengthKm: 7.280, laps: 65, corners: 12, direction: '顺时针', type: '公路赛道',
    baseLap: 150.0, power: 0.70, df: 0.60, tyre: 0.45, rain: 0.45,
    desc: '森林公路赛道，树木与湿滑路面让容错率极低。'
  },
  {
    id: 'boavista', gp: '博阿维斯塔站', circuit: '博阿维斯塔街道赛道', city: '波尔图', country: '葡萄牙',
    date: '经典赛历', sprint: false, legacy: true, era: '1958–1960',
    lengthKm: 7.775, laps: 60, corners: 22, direction: '逆时针', type: '街道赛道',
    baseLap: 150.0, power: 0.78, df: 0.55, tyre: 0.45, rain: 0.35,
    desc: '波尔图街道经典，石板路与狭窄弯角制造巨大变量。'
  },
  {
    id: 'aindiab', gp: '艾因迪亚布站', circuit: '艾因迪亚布赛道', city: '卡萨布兰卡', country: '摩洛哥',
    date: '经典赛历', sprint: false, legacy: true, era: '1958',
    lengthKm: 7.618, laps: 60, corners: 15, direction: '顺时针', type: '公路赛道',
    baseLap: 150.0, power: 0.80, df: 0.50, tyre: 0.42, rain: 0.20,
    desc: '摩洛哥海岸公路赛道，长直道与沙尘让抓地力多变。'
  },
  {
    id: 'phoenix', gp: '凤凰城站', circuit: '凤凰城街道赛道', city: '凤凰城', country: '美国',
    date: '经典赛历', sprint: false, legacy: true, era: '1989–1991',
    lengthKm: 3.720, laps: 81, corners: 11, direction: '逆时针', type: '街道赛道',
    baseLap: 90.0, power: 0.60, df: 0.65, tyre: 0.55, rain: 0.05,
    desc: '沙漠城市街道赛，直角弯与高温是主要挑战。'
  },
  {
    id: 'indianapolis', gp: '印第安纳波利斯站', circuit: '印第安纳波利斯赛道', city: '斯皮德韦', country: '美国',
    date: '经典赛历', sprint: false, legacy: true, era: '2000–2007',
    lengthKm: 4.192, laps: 73, corners: 13, direction: '顺时针', type: '永久赛道',
    baseLap: 82.0, power: 0.86, df: 0.50, tyre: 0.50, rain: 0.30,
    desc: '椭圆大直道与内场路段的混合，尾速与牵引力并重。'
  },
  {
    id: 'okayama', gp: '冈山站', circuit: '冈山国际赛道', city: '冈山', country: '日本',
    date: '经典赛历', sprint: false, legacy: true, era: '1994–1995',
    lengthKm: 3.703, laps: 83, corners: 13, direction: '顺时针', type: '永久赛道',
    baseLap: 75.0, power: 0.55, df: 0.70, tyre: 0.55, rain: 0.30,
    desc: '太平洋站举办地，短赛道与低速弯让交通管理成为难题。'
  },
  {
    id: 'osterreichring', gp: '奥地利环站', circuit: 'Österreichring', city: '施皮尔贝格', country: '奥地利',
    date: '经典赛历', sprint: false, legacy: true, era: '1970–1987',
    lengthKm: 5.911, laps: 54, corners: 18, direction: '顺时针', type: '永久赛道',
    baseLap: 100.0, power: 0.85, df: 0.65, tyre: 0.55, rain: 0.30,
    desc: '红牛环的前身，超高速山丘赛道，长直道与高速弯考验勇气与尾速。'
  },
  {
    id: 'avus', gp: 'AVUS 站', circuit: 'AVUS 公路赛道', city: '柏林', country: '德国',
    date: '经典赛历', sprint: false, legacy: true, era: '1959',
    lengthKm: 8.300, laps: 60, corners: 6, direction: '顺时针', type: '公路赛道',
    baseLap: 160.0, power: 0.98, df: 0.18, tyre: 0.35, rain: 0.25,
    desc: '两条超长直道与倾斜弯组成的德国高速怪物，尾速与刹车稳定性决定成败。'
  },
  {
    id: 'pedralbes', gp: '佩德拉尔韦斯站', circuit: '佩德拉尔韦斯街道赛道', city: '巴塞罗那', country: '西班牙',
    date: '经典赛历', sprint: false, legacy: true, era: '1951–1954',
    lengthKm: 6.316, laps: 70, corners: 6, direction: '顺时针', type: '街道赛道',
    baseLap: 120.0, power: 0.70, df: 0.50, tyre: 0.45, rain: 0.15,
    desc: '巴塞罗那山脚下的宽阔街道赛，长弯与老式路面让抓地力变化无常。'
  },
  {
    id: 'monsanto', gp: '蒙桑图站', circuit: '蒙桑图公园赛道', city: '里斯本', country: '葡萄牙',
    date: '经典赛历', sprint: false, legacy: true, era: '1959',
    lengthKm: 5.440, laps: 65, corners: 12, direction: '顺时针', type: '街道赛道',
    baseLap: 105.0, power: 0.55, df: 0.70, tyre: 0.50, rain: 0.25,
    desc: '里斯本公园中的石板街道赛，混合抓地力与护栏让容错率极低。'
  },
  {
    id: 'dijon', gp: '第戎站', circuit: '第戎-普雷努瓦赛道', city: '第戎', country: '法国',
    date: '经典赛历', sprint: false, legacy: true, era: '1974–1984',
    lengthKm: 3.801, laps: 80, corners: 10, direction: '顺时针', type: '永久赛道',
    baseLap: 72.5, power: 0.65, df: 0.66, tyre: 0.55, rain: 0.25,
    desc: '短小流畅的法国赛道，长弯与低速发夹让机械抓地力成为关键。'
  },
  {
    id: 'nivelles', gp: '尼维尔站', circuit: '尼维尔-博莱尔赛道', city: '尼维尔', country: '比利时',
    date: '经典赛历', sprint: false, legacy: true, era: '1972–1974',
    lengthKm: 3.724, laps: 85, corners: 9, direction: '顺时针', type: '永久赛道',
    baseLap: 75.0, power: 0.62, df: 0.65, tyre: 0.55, rain: 0.30,
    desc: '宽阔平坦的比利时赛道，长直道与简单弯角考验引擎与制动。'
  },

];
