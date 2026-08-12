import type { WeatherAdvice, WeatherDay } from "@/types";

const TOKYO = { latitude: 35.6762, longitude: 139.6503 };

function getCoords(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) {
      resolve(TOKYO);
      return;
    }
    const timer = setTimeout(() => resolve(TOKYO), 4000);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer);
        resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      },
      () => {
        clearTimeout(timer);
        resolve(TOKYO);
      },
      { timeout: 4000 }
    );
  });
}

interface OpenMeteoResponse {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    relative_humidity_2m_mean?: number[];
    uv_index_max: number[];
  };
}

function buildLookahead(days: WeatherDay[]): { title: string; detail: string }[] {
  const lookahead: { title: string; detail: string }[] = [];

  for (let i = 1; i < days.length; i++) {
    const prev = days[i - 1];
    const cur = days[i];
    if (prev.humidity - cur.humidity >= 15) {
      lookahead.push({
        title: `${cur.date}: 湿度急落`,
        detail: `前日から湿度が${Math.round(prev.humidity - cur.humidity)}pt下がる見込み。乾燥対策を早めに。`,
      });
      break;
    }
  }

  const peakUv = days.slice(1).find((d) => d.uvIndex >= 8);
  if (peakUv) {
    lookahead.push({
      title: `${peakUv.date}: UVピーク`,
      detail: `UV指数${peakUv.uvIndex}の強い紫外線予報。日焼け止めの塗り直しを意識して。`,
    });
  }

  for (let i = 1; i < days.length; i++) {
    const diff = Math.abs(days[i].tempMax - days[i - 1].tempMax);
    if (diff >= 8) {
      lookahead.push({
        title: `${days[i].date}: 寒暖差`,
        detail: `前日から気温が${Math.round(diff)}℃変化。肌のゆらぎに注意。`,
      });
      break;
    }
  }

  return lookahead.slice(0, 3);
}

function buildTodayAdvice(today: WeatherDay): { headline: string; tips: string[] } {
  const tips: string[] = [];
  if (today.humidity < 40) tips.push("湿度が低め。保湿力の高いクリームでフタをしっかり。");
  if (today.humidity > 75) tips.push("湿度が高め。皮脂崩れしやすいので軽めのテクスチャーがおすすめ。");
  if (today.uvIndex >= 8) tips.push("UV指数が非常に高い。日焼け止めはSPF50+/PA++++を選び、こまめに塗り直しを。");
  else if (today.uvIndex >= 6) tips.push("UV指数が高め。日焼け止めをしっかり塗って外出を。");
  else if (today.uvIndex >= 3) tips.push("UV指数は中程度。普段使いのUVケアで十分。");
  if (today.tempMax >= 30) tips.push("気温が高い。皮脂・汗によるベタつきに軽めのアイテムで対策を。");
  if (today.tempMax <= 5) tips.push("気温が低い。乾燥・こわばりに備えて重ねづけ保湿を。");

  const headline =
    tips.length > 0 ? "今日は肌に負担がかかりやすい気象条件です" : "今日は肌に大きな負担がかかりにくい気象条件です";

  return { headline, tips: tips.length > 0 ? tips : ["いつも通りの基本ケアで問題なさそう。"] };
}

export async function fetchWeatherAdvice(): Promise<WeatherAdvice> {
  const { latitude, longitude } = await getCoords();
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean,uv_index_max&timezone=auto&forecast_days=7`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("天気データの取得に失敗しました");
  const data = (await res.json()) as OpenMeteoResponse;

  const days: WeatherDay[] = data.daily.time.map((date, i) => ({
    date,
    tempMax: data.daily.temperature_2m_max[i],
    tempMin: data.daily.temperature_2m_min[i],
    humidity: data.daily.relative_humidity_2m_mean?.[i] ?? 55,
    uvIndex: data.daily.uv_index_max[i],
  }));

  return {
    today: buildTodayAdvice(days[0]),
    week: days,
    lookahead: buildLookahead(days),
  };
}
