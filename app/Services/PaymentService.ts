import Config from '@ioc:Adonis/Core/Config'

export default class PaymentService {

    protected static mp: any = Config.get('app.mercadoPago')

    public static async getPayment(collectionId: number) {
        return await fetch(`https://api.mercadopago.com/v1/payments/${collectionId}?access_token=${this.mp.accessToken}`)
            .then((response) => { return response.json() })
    }

    public static async createPayment(benId: number, compId: number, amount: number) {

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
                        title: 'Nobis Dummy Title',
                        description: 'Nobis Dummy description',
                        picture_url: 'https://mla-s2-p.mlstatic.com/988269-MLA46389806195_062021-O.jpg',
                        category_id: "category123",
                        quantity: 1,
                        unit_price: amount
                    }
                ],
                auto_return: 'approved',
                external_reference: JSON.stringify({
                    benId: benId,
                    compId: compId,
                }),
                notification_url: 'https://mp-webhooks.onrender.com/payments/notification',
                back_urls: {
                    success: 'https://frontend.nobissalud.com/#/dashboard/estado-de-cuenta',
                    failure: 'https://frontend.nobissalud.com/#/dashboard/estado-de-cuenta',
                    pending: 'https://frontend.nobissalud.com/#/dashboard/estado-de-cuenta'
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
