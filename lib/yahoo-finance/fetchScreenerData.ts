import useStockStore from "@/store/stockStore";
import { ScreenerData } from "@/types/screener-data";

// 获取筛选器数据
export async function fetchScreenerData(screenerType: string = "aggressive_small_caps", count: number = 40) {
    const store = useStockStore.getState();
    const currentScreenerData = store.screenerData;

    // 只有当筛选器类型不同或数据超过30秒未更新时，才重新获取
    const needsUpdate = !currentScreenerData ||
        currentScreenerData.screenerType !== screenerType ||
        (Date.now() - currentScreenerData.lastUpdated > 30000);

    if (needsUpdate) {
        try {
            const response = await fetch(`/api/py/stock/screener?screener=${screenerType}&count=${count}`);
            const data = await response.json();

            if (data && data.quotes) {
                const screenerData: ScreenerData = {
                    quotes: data.quotes,
                    screenerType,
                    lastUpdated: Date.now(),
                    error: data.error
                };

                store.setScreenerData(screenerData);
                return screenerData;
            }
        } catch (error) {
            console.error("获取筛选器数据失败:", error);
            return currentScreenerData;
        }
    }

    return currentScreenerData;
}