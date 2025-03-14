/**
 * 获取股票热力图数据
 * @param type 热力图类型：全市场(all)、行业板块(industry)、概念板块(concept)
 * @returns 热力图数据
 */
export async function fetchHeatmapData(type: string = "all") {
  const url = `/api/py/stock/heatmap?type=${type}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`获取热力图数据失败: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("获取热力图数据失败:", error);
    return {
      success: false,
      message: `获取热力图数据失败: ${error}`,
      sectors: []
    };
  }
}