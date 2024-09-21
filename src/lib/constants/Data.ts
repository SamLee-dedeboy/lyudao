// export const groupclass = ["driver_region","pressure_region","state_region","impact_region","response_region"]
export const var_type_names = [
  "driver",
  "pressure",
  "state",
  "impact",
  "response",
];
export const topicname = [
  "政府運作",
  "海域生態環境",
  "住屋",
  "交通",
  "醫療",
  "整體經濟",
  "能源",
  "其他",
  "垃圾處理",
  "公有土地",
  "文化",
  "觀光",
  "災害",
  "陸地生態環境",
];
export const emotionname = ["resigned", "neutral", "worried", "angry", "proud"];
export const stepMap = {
  1: "var_type",
  2: "var",
  3: "link",
};

export const stepInfo = [
  { number: 1, key: 'var_type', name: 'Indicators' },
  { number: 2, key: 'var', name: 'Variables' },
  { number: 3, key: 'link', name: 'Links' }
];
