angular.module('myApp.homeController', ['myApp.services'])

.controller('homeController', ['$http', '$state', '$rootScope', 'getColor', 'getDate', function($http, $state, $rootScope, getColor, getDate) {
  let user_id = Number(localStorage.getItem('user_id'))
  if (!user_id) $state.go('login')
  let home = this
  home.userId = user_id
  getUserInfo()

  function getUserInfo() {
    $http.post('https://whispering-shelf-88050.herokuapp.com/login/getUserInfo', {user_id}).then(name => {
      home.fullName = name.data.first_name + ' ' + name.data.last_name
    })

  }


  getDaysInMonth = () => {
    home.year = new Date().getFullYear()
    let month = new Date().getMonth()
    home.dayOfMonth = new Date().getDate()
    home.daysInMonth = Date.getDaysInMonth(home.year, month)
    home.daysPassedPercentage = home.dayOfMonth / home.daysInMonth * 100
    home.daysLeftPercentage =100 - home.daysPassedPercentage
    home.monthName = getDate.getMonthName(month)
  }
  getDaysInMonth()


  getGaugeStats = () => {
    $http.post('https://whispering-shelf-88050.herokuapp.com/dailyExpenses/getGaugeStats', {user_id, currentMonth: home.monthName, year: home.year}).then(gaugeStats => {
      console.log(gaugeStats);
      if (gaugeStats.data[0].monthly_income === null) {
        home.noIncomeData = true
        return
      }
      home.gaugeStats = gaugeStats.data.map(cat => {
        cat.allocated_for_budget = (Number(cat.desired_spend_percentage) / 100) * Number(cat.monthly_income)
        cat.daily_fixed_expense = cat.fixed_expense_amount / home.daysInMonth
        cat.current_fixed_expense_amortized = cat.daily_fixed_expense * home.dayOfMonth
        cat.spend_total = Number(cat.spend_total) + cat.current_fixed_expense_amortized
        cat.budget_left = cat.allocated_for_budget - Number(cat.spend_total)
        cat.spent_percentage = (Number(cat.spend_total) / cat.allocated_for_budget * 100).toFixed(2)
        cat.budget_left_percentage = (cat.budget_left / cat.allocated_for_budget * 100).toFixed(2)
        cat.percentage_spent = Number((cat.spend_total / cat.allocated_for_budget * 100).toFixed())
        cat.max_gauge = cat.gauge_max
        return cat
      })
      home.savings = home.gaugeStats.find((cat) => cat.expense_category == 'savings')
      home.gaugeStats = home.gaugeStats.filter(cat => cat.expense_category !== 'savings')
      let currentSpending = home.gaugeStats.reduce((total, elem) => {
        return total += elem.spend_total
      }, 0)
      home.savingsData = {}
      home.savingsData.current_spending = currentSpending
      home.gaugeStats = home.gaugeStats.map(cat => {
        cat.spend_percentage = ((cat.spend_total / ((Number(gaugeStats.data[0].monthly_income) / home.daysInMonth) * home.dayOfMonth )) * 100).toFixed()
        if (isNaN(cat.spend_percentage)) cat.spend_percentage = 0
        return cat
      })
      home.savingsData.expense_category = 'savings'
      home.savingsData.desired_daily_saving = home.savings.allocated_for_budget / home.daysInMonth
      home.savingsData.desired_daily_spending = (home.savings.monthly_income - home.savings.allocated_for_budget) / home.daysInMonth
      home.savingsData.current_daily_spending = home.savingsData.current_spending / home.dayOfMonth
      home.savingsData.daily_income = home.savings.monthly_income / home.daysInMonth
      home.savingsData.current_daily_saving = home.savingsData.daily_income - home.savingsData.current_daily_spending
      home.savingsData.current_saving = home.savingsData.current_daily_saving * home.dayOfMonth
      home.savingsData.current_saving_percentage = (Number(home.savingsData.current_daily_saving / home.savingsData.daily_income * 100).toFixed())
      home.savingsData.monthly_saving_percentage_of_budget = Number((home.savingsData.current_saving / home.savings.allocated_for_budget * 100).toFixed())
      if (home.savingsData.monthly_saving_percentage_of_budget > 100) {home.savingsData.monthly_saving_percentage_of_budget = 100}
      home.savingsData.savings_to_go_percentage = 100 - home.savingsData.monthly_saving_percentage_of_budget
      home.savingsData.desired_spend_percentage = home.savings.desired_spend_percentage
      home.savingsDataReady = true
      function sorter(a, b) {
        if (a.desired_spend_percentage < b.desired_spend_percentage) return -1;
        if (a.desired_spend_percentage > b.desired_spend_percentage) return 1;
        return 0;
      }
      home.gaugeStats.sort(sorter).reverse()
      createSpendCategoryBar()
      createDailySpendingBar()
      getDailyAverages()
    })
  }

  getGaugeStats()


  getDailyAverages = () => {
    $http.post('https://whispering-shelf-88050.herokuapp.com/dailyExpenses/getDailyAverages', {user_id, currentMonth: home.monthName}).then(avgs => {
      avgs.data.forEach(day => {
        dayObj[day.day] = Number(day.sum)
      })
      home.finalDayAvgArray = []
      for (day in dayObj) {
        home.finalDayAvgArray.push([day, Number(dayObj[day]), '#14ED14'])
      }
      home.finalDayAvgArray.unshift(['Day', '$', {role: 'style'}])
      console.log(home.finalDayAvgArray);
      home.dayAvgBarReady = true
    })
  }

  let dayObj = {
    'Monday': 0,
    'Tuesday': 0,
    'Wednesday': 0,
    'Thursday': 0,
    'Friday': 0,
    'Saturday': 0,
    'Sunday': 0
  }

  home.daysOfWeek = Object.keys(dayObj)


  function createSpendCategoryBar() {
    home.finalCategoryBarData = []
    let categoryBarObj = home.gaugeStats.reduce((obj, elem) =>{
      obj[elem.expense_category] = elem.spend_total
      return obj
    }, {})
    for (let exp in categoryBarObj) {

      home.finalCategoryBarData.push([exp, Number(categoryBarObj[exp].toFixed()), '#14ED14'])
    }
    function Comparator(a, b) {
      if (a[1] < b[1]) return -1;
      if (a[1] > b[1]) return 1;
      return 0;
    }
    home.finalCategoryBarData.sort(Comparator).reverse()
    home.finalCategoryBarData.push(['savings', Number(home.savingsData.current_saving.toFixed()), '#14ED14'])
    home.finalCategoryBarData.unshift(['Expense Category', '$', {role: 'style'}])
    home.barChartReady = true
  }

  function createDailySpendingBar() {
    home.dailySpendingBarData = []

    home.dailySpendingBarData.push(['Daily Net Income', Number(home.savingsData.daily_income.toFixed()), '#14ED14'])
    home.dailySpendingBarData.push(['Daily Spending', Number(home.savingsData.current_daily_spending.toFixed()), '#14ED14'])
    home.dailySpendingBarData.push(['Daily Savings', Number(home.savingsData.current_daily_saving.toFixed()), '#14ED14'])
    home.dailySpendingBarData.unshift(['Savings/Spending', '$', {role: 'style'}])
    home.dailySpendingBarReady = true
  }

  function createHeatmap() {
    $http.post('https://whispering-shelf-88050.herokuapp.com/dailyExpenses/getHeatmap', {user_id, month: home.monthName, year: home.year}).then((heatmap) => {
      home.heatmapY = Object.keys(heatmap.data.reduce((obj, elem) => {
        let cat = elem.expense_category.split('')
        let upperCase = cat.splice(0, 1).join('').toUpperCase()
        cat.unshift(upperCase)
        cat = cat.join('')
        obj[cat] = true
        return obj
      }, {}))
      console.log(home.heatmapY);
      let expense_lookup = home.heatmapY.reduce((obj, elem, ind) => {
        obj[elem] = ind
        return obj
      }, {})

      home.heatmapData = heatmap.data.map(elem => {
        let cat = elem.expense_category.split('')
        let upperCase = cat.splice(0, 1).join('').toUpperCase()
        cat.unshift(upperCase)
        cat = cat.join('')
        elem.dayNum = getDate.getDayNumber(elem.day)
        elem.expenseNum = expense_lookup[cat]
        return [elem.dayNum, elem.expenseNum, Number(elem.spend_total)]
      })
      home.heatmapReady = true
      console.log(home.heatmapData);
    })
  }
  createHeatmap()

}])
