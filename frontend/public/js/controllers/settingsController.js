angular.module('myApp.settingsController', [])

.controller('settingsController', ['$http', '$state', '$rootScope', 'getDate', '$timeout', function($http, $state, $rootScope, getDate, $timeout) {
  let user_id = Number(localStorage.getItem('user_id'))
  console.log(user_id);
  if (!user_id) $state.go('login')
  let settings = this
  settings.userId = user_id
  settings.expenseCategories = []
  settings.selectedTab = 'expenseCategories'
  settings.percentageTotal
  settings.noIncomeData = false
  settings.editingIncome = false
  settings.fixedExpenses = []
  settings.fixedExpenseInputs = [1]
  settings.incomeYear = new Date().getFullYear()
  let month = new Date().getMonth()
  settings.incomeMonth = getDate.getMonthName(month)

  settings.selectTab = (li, name) => {
    let tabs = document.getElementsByTagName('li')
    for(let i = 0; i < tabs.length; i++) {
      tabs[i].className = ''
    }
    li = document.getElementById(li)
    li.className = 'selected'
    settings.selectedTab = name
  }

  function getPercentageTotal() {
    let total = 0
    settings.expenseCategories.forEach(cat => total += Number(cat['percentage']))
    settings.percentageTotal = total
  }
  getExpenseCategories = () => {
    $http.post('https://whispering-shelf-88050.herokuapp.com/accountSettings/getExpenseCategories', {user_id}).then(categories => {
      settings.expenseCategories = categories.data.map(cat => {
        return {
          catId: cat.id,
          expense_category: cat.expense_category,
          percentage: cat.percentage,
          isEditing: false
        }
      })
      settings.fixedExpenseCategory = settings.expenseCategories[0].expense_category
      getPercentageTotal()
    })
  }
  getExpenseCategories()

  settings.submitTempExpenses = (i, id) => {
  settings.expenseCategories.forEach(cat => {
    if (cat['catId'] == id) {
      cat['expense_category'] = document.getElementById(i + 'expCat')['value'].toLowerCase()
      cat['percentage'] = document.getElementById(i + 'percentage')['value']
    }
  })
  getPercentageTotal()
}


  settings.addCategory = (cat) => {
    cat = document.getElementById(cat)
    settings.expenseCategories.push({
      id: cat,
      expense_category: cat.value.toLowerCase(),
      percentage: 0,
      isEditing: false
    })
    cat.value = ''
  }
  settings.wipeCatValue = (cat) => {
    document.getElementById(cat).value = ''
  }

  settings.deleteCategory = (catId) => {
    console.log(catId);
    for(let i = 0; i < settings.expenseCategories.length; i++) {
      if (settings.expenseCategories[i]['catId'] == catId) {
        settings.expenseCategories.splice(i, 1)
      }
    }
    getPercentageTotal()
  }

  settings.submitExpensesToDatabase = () => {
    let total = 0
    settings.expenseCategories.forEach(cat => total += Number(cat['percentage']))
    if (total === 100) {
      console.log(settings.expenseCategories);
      $http.post('https://whispering-shelf-88050.herokuapp.com/accountSettings/updateExpenseCategories', {user_id, expenseCategories: settings.expenseCategories}).then(data => {
        console.log(data.data)
        settings.badMath = false
        settings.expensesSavedMessage = true
        $timeout(function() {
          settings.expensesSavedMessage = false
          console.log(settings.expensesSavedMessage);
        }, 2000)
      })
    } else {
      settings.badMath = true
    }
  }

  getMonthlyIncome = () => {
    $http.post('https://whispering-shelf-88050.herokuapp.com/accountSettings/getIncome', {user_id}).then(income => {
      console.log(income.data);
      if (income.data) {
        settings.userIncome = income.data
        settings.noIncomeData = false
      } else {
        settings.noIncomeData = true
      }
      console.log(this.noIncomeData);
    })
  }
  getMonthlyIncome()

  settings.editIncome = (updatedIncome) => {
    let income = document.getElementById('updatedIncome')['value']
    $http.post('https://whispering-shelf-88050.herokuapp.com/accountSettings/updateIncome', {user_id, income}).then(income => {
      settings.userIncome = income.data
      settings.editingIncome = false
    })
  }

  settings.submitIncome = (income) => {
    income = document.getElementById(income).value
    $http.post('https://whispering-shelf-88050.herokuapp.com/accountSettings/enterIncome', {user_id, income}).then(data => {
      getMonthlyIncome()
    })
  }

  getFixedExpenses = () => {
    $http.post('https://whispering-shelf-88050.herokuapp.com/accountSettings/getFixedExpenses', {user_id}).then(data => {
      console.log(data.data);
      settings.fixedExpenses = data.data
    })
  }
  getFixedExpenses()

  settings.deleteFixedExpense = function(id) {
    $http.post('https://whispering-shelf-88050.herokuapp.com/accountSettings/deleteFixedExpense', {id}).then(() => {
      getFixedExpenses()
    })
  }

  settings.addFixedExpense = () => {
    let num = settings.fixedExpenseInputs[settings.fixedExpenseInputs.length - 1] + 1
    settings.fixedExpenseInputs.push(num)
  }

  settings.submitFixedExpenses = () => {
    let expenseObj = {}
    expenseObj['1'] = {}
    expenseObj['1'].expenseCategory = settings.fixedExpenseCategory.toLowerCase()
    expenseObj['1'].amount = settings.fixedExpenseAmount
    $http.post('https://whispering-shelf-88050.herokuapp.com/accountSettings/addFixedExpenses', {user_id, fixed_expenses: expenseObj}).then(data => {
      getFixedExpenses()
      settings.fixedExpenseInputs = [1]
      settings.fixedExpenseCategory = ''
      settings.fixedExpenseAmount = ''
    })
  }

  settings.addIncome = () => {
    $http.post('https://whispering-shelf-88050.herokuapp.com/accountSettings/addExtraIncome', {user_id, amount: settings.extraIncomeAmount, memo: settings.incomeMemo, month: settings.incomeMonth, year: settings.incomeYear}).then(() => {
      settings.extraIncomeAmount = ''
      settings.incomeMemo = ''
      getExtraIncome()
    })
  }

  settings.months = ['January','February','March','Arpil','May','June','July','August','September','October','November','December']

  function getExtraIncome() {
    $http.post('https://whispering-shelf-88050.herokuapp.com/accountSettings/getExtraIncome', {user_id, month: settings.incomeMonth, year: settings.incomeYear}).then(data => {
      settings.extraIncome = data.data.map(income => {
        income.isEditing = false
        return income
      })
    })
  }
  getExtraIncome()


  settings.updateExtraIncome = function (id, index) {
    let memo = document.getElementById(index + 'ei-memo').value
    let amount = document.getElementById(index + 'ei-amount').value
    $http.post('https://whispering-shelf-88050.herokuapp.com/accountSettings/updateExtraIncome', {id, memo, amount}).then(() => getExtraIncome())
  }

  settings.deleteExtraIncome = function (id) {
    $http.post('https://whispering-shelf-88050.herokuapp.com/accountSettings/deleteExtraIncome', {id}).then(() => getExtraIncome())
  }



}])
