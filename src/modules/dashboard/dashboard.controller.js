const svc = require('./dashboard.service');
const asyncHandler = require('../../utils/asyncHandler');

exports.getSummary = asyncHandler(async (req, res) => {
  const [summary, recentOrders, topSellingProducts, weeklyChart] = await Promise.all([
    svc.getSummary(),
    svc.getRecentOrders(10),
    svc.getTopSellingProducts(5),
    svc.getWeeklyChart()
  ]);

  res.json({
    success: true,
    data: {
      summary,
      recentOrders,
      topSellingProducts,
      weeklyChart
    }
  });
});
