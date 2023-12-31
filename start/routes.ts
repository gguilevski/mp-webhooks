/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/

import Route from '@ioc:Adonis/Core/Route'

Route.get('/', ({ response }) => {
  response.redirect().toPath('/docs')
})

Route.post('payments/preference', 'PaymentsController.getPaymentLink')

Route.post('payments/notification', 'PaymentsController.notification')
Route.post('payments/notification/pro', 'PaymentsController.notificationPro')

Route.get('payments/notification/all', 'PaymentsController.getNotification')
Route.get('payments/payment/:id', 'PaymentsController.getPayment')

Route.group(() => {
  Route.post('register', 'AuthController.register')
  Route.post('login', 'AuthController.login')
  Route.get('logout', 'AuthController.logout').middleware('auth')
  Route.get('/auth/token', 'AuthController.getTokenInfo').middleware('auth')
})

Route.get('/terms/new', 'TermsController.getNewlyAddedTerms')
Route.get('/terms/random', 'TermsController.getRandomDefinitions')
Route.get('/categories', 'CategoriesController.index')
Route.get('/search', 'SearchController.index')
Route.get('/definitions', 'DefinitionsController.index')

Route.group(() => {
  Route.get('/dashboard', 'DashboardUsersController.index')
  Route.post('/definitions', 'DefinitionsController.store')
  Route.put('/definitions/:id', 'DefinitionsController.update')
  Route.delete('/definitions/:id', 'DefinitionsController.destroy')
  Route.post('/definitions/:id/vote', 'VotesController.store')
}).middleware('auth')

Route.get('/definitions/:id', 'DefinitionsController.show')

Route.group(() => {
  Route.get('/definitions', 'ManageDefinitionsController.index')
  Route.get('/definitions/review', 'ManageDefinitionsController.getReviewedDefinitions')
  Route.put('/definitions/:id/review', 'ManageDefinitionsController.reviewDefinitions')
  Route.get('/definitions/deleted', 'ManageDefinitionsController.getDeletedDefinitions')
  Route.delete('/definitions/:id/delete', 'ManageDefinitionsController.destroy')
  Route.get('/statistics', 'ManageDefinitionsController.statistics')
})
  .middleware('auth')
  .prefix('/admin')

Route.group(() => {
  Route.get('users', 'UsersController.index')
  Route.get('users/:id', 'UsersController.show')
  Route.delete('users/:id', 'UsersController.destroy')
  Route.get('roles', 'RolesController.index')
  Route.put('users/:id/role', 'UserRolesController.update')
}).middleware('auth')

Route.any('/*', async () => {
  return {
    code: 404,
    status: 'Not Found',
    message: 'Route not found',
  }
})
