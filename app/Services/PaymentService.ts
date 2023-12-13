import Config from '@ioc:Adonis/Core/Config'

export default class PaymentService {

    protected static mp: any = Config.get('app.mercadoPago')

    //Access Token APP_USR-2329133413881945-101210-99c61e8176b8974df8ae7aab48e15795-1509805036


    public static async createPayment(price: number) {

        const settings = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.mp.accessToken}`
            },
            body: JSON.stringify({
                payer_email: "test_user_46945293@testuser.com",
                items: [
                    {
                        title: "Nobis Dummy Title",
                        description: "Nobis Dummy description",
                        picture_url: "http://www.myapp.com/myimage.jpg",
                        category_id: "category123",
                        quantity: 1,
                        unit_price: price
                    }
                ],
                auto_return: 'approved',
                back_urls: {
                    success: this.mp.successUrl,
                    failure: this.mp.failureUrl,
                    pending: this.mp.pendingUrl
                }
            })
        }


        const response = await fetch('https://api.mercadopago.com/checkout/preferences', settings)


        return await response.json()

        // return {
        //     status: response.status,
        //     price: price,
        //     isSuccessful: response.ok,
        //     data: await response.json()
        // }
    }

}
