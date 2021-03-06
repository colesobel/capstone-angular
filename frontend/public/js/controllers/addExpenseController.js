angular.module('myApp.addExpenseController', [])


.controller('addExpenseController', ['$http', '$state', '$rootScope', 'getDate', function($http, $state, $rootScope, getDate) {
  let user_id = Number(localStorage.getItem('user_id'))
  if (!user_id) $state.go('login')
  let addExpense = this
  addExpense.userId = user_id
  addExpense.dateString = new Date().toISOString().substring(0, 10)
  addExpense.expenses = [1]

  addExpense.addAnExpense = () => {
    let num = addExpense.expenses[addExpense.expenses.length - 1] + 1
    addExpense.expenses.push(num)
  }

  getExpenseCategories = () => {
    $http.post('https://whispering-shelf-88050.herokuapp.com/accountSettings/getExpenseCategories', {user_id}).then(categories => {
      addExpense.expenseCategories = categories.data.filter(cat => {
        return cat.expense_category != 'savings'
      })
    })
  }

  getExpenseCategories()

  addExpense.onSubmit = function() {

    let expenseItems = document.getElementsByClassName('expense-container')
    let expenseObj = {}
    for(let i = 0; i < expenseItems.length; i++) {
      expenseObj[i] = {}
      expenseObj[i].expenseCategory = expenseItems[i]['children'][1]['value'].toLowerCase()
      let amount = expenseItems[i]['children'][2]['value']
      if (amount == 0) amount = 1
      expenseObj[i].amount = Number(amount).toFixed()
      let date = expenseItems[i]['children'][3]['value']
      expenseObj[i].fullDate = date
      expenseObj[i].unixTimestamp = new Date(date).getTime()
      expenseObj[i].day = getDate.getDayName(new Date(date).getDay())
      expenseObj[i].month = getDate.getMonthName(new Date(date).getMonth())
      expenseObj[i].year = new Date(date).getFullYear()
      expenseObj[i].memo = expenseItems[i]['children'][4]['value']
    }
    expenseObjString = JSON.stringify(expenseObj)
    $http.post('https://whispering-shelf-88050.herokuapp.com/dailyExpenses/addExpense2', {user_id, expenseObj: expenseObjString}).then(function() {
        addExpense.expenses = [1]
        setTimeout(() => {
          $state.go('home')
        }, 250)
    })
  }

  addExpense.closeModal = function () {
    addExpense.expenses = [1]
  }

}])
