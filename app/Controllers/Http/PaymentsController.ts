import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { createResponse } from 'App/Helpers/Customs'
//import Database from '@ioc:Adonis/Lucid/Database'
import PaymentService from 'App/Services/PaymentService'
import Application from '@ioc:Adonis/Core/Application'
import { DateTime } from "luxon"

export default class PaymentsController {

    protected res: ResponseInterface = createResponse({ code: 200, status: 'Success' })

    public async getPaymentLink({ request, response }: HttpContextContract): Promise<void> {

        const price: number = request.input('amount')


        //return response.status(this.res.code).json(price)

        try {

            const payment: any = await PaymentService.createPayment(price)
            this.res.data = payment

            return response.status(this.res.code).json(this.res)
        } catch (error: any) {
            this.res.code = 500
            this.res.status = 'Error'
            this.res.message = 'Internal server error'

            if (error.code === 'E_ROW_NOT_FOUND') {
                this.res.code = 404
                this.res.status = 'Not Found'
                this.res.message = 'User not found'
            }

            if (error.code === 'E_AUTHORIZATION_FAILURE') {
                this.res.code = 403
                this.res.status = 'Forbidden'
                this.res.message = "You can't perform this action"
            }

            return response.status(this.res.code).json(this.res)
        }
    }

    public async notification({ request, response }: HttpContextContract): Promise<void> {

        try {
            const dateTimeNow = DateTime.now()

            const { writeFile } = require('fs');

            const path = Application.tmpPath('uploads') + '/mp' + dateTimeNow.toUnixInteger() + '.json'
            const config = request.all()

            writeFile(path, JSON.stringify(config, null, 2), (error: any) => {
                if (error) {
                    console.log('An error has occurred ', error)
                }
                console.log('Data written successfully to disk')
            })

            this.res.data = request.all()

            return response.status(this.res.code).json(this.res)
        } catch (error: any) {
            this.res.code = 500
            this.res.status = 'Error'
            this.res.message = 'Internal server error'

            if (error.code === 'E_ROW_NOT_FOUND') {
                this.res.code = 404
                this.res.status = 'Not Found'
                this.res.message = 'User not found'
            }

            if (error.code === 'E_AUTHORIZATION_FAILURE') {
                this.res.code = 403
                this.res.status = 'Forbidden'
                this.res.message = "You can't perform this action"
            }

            return response.status(this.res.code).json(this.res)
        }
    }

    public async getPayment({ params, response }: HttpContextContract): Promise<void> {
        const { id: collectionId }: Record<string, number> = params

        try {
            this.res.data = await PaymentService.getPayment(collectionId)

            return response.status(this.res.code).json(this.res)
        } catch (error: any) {
            this.res.code = 500
            this.res.status = 'Error'
            this.res.message = error.message

            if (error.code === 'E_ROW_NOT_FOUND') {
                this.res.code = 404
                this.res.status = 'Not Found'
                this.res.message = 'Definitions not found'
            }

            return response.status(this.res.code).json(this.res)
        }
    }


    public async getNotification({ response }: HttpContextContract): Promise<void> {
        try {
            const fs = require('node:fs');
            const folderPath = Application.tmpPath('uploads')

            const notifications: any = [];

            const files = fs.readdirSync(folderPath)


            //this.res.data = await PaymentService.getPayment(68752272274)

            await Promise.all(files.map(async (file: string) => {
                const rawdata = fs.readFileSync(folderPath + '/' + file);
                const mp = JSON.parse(rawdata)

                const payment: any = await PaymentService.getPayment(mp.data.id)

                mp.payment = {
                    date_created: payment.date_created,
                    date_approved: payment.date_approved,
                    status: payment.status,
                    items: payment.additional_info.items
                }

                // console.log(payment.date_created)

                notifications.push({
                    id: payment.id,
                    description: payment.description,
                    date_created: payment.date_created,
                    date_approved: payment.date_approved,
                    status: payment.status,
                    items: payment.additional_info.items
                })
            }));



            // files.forEach(async (file: string) => {
            //     const rawdata = fs.readFileSync(folderPath + '/' + file);
            //     const mp = JSON.parse(rawdata)

            //     const payment: any = await PaymentService.getPayment(mp.data.id)

            //     console.log(payment.date_created)

            //     notifications.push(payment)
            // });



            // files.forEach(async (file: string) {
            //     const rawdata = fs.readFileSync(folderPath + '/' + file);
            //     const mp = JSON.parse(rawdata)

            //     const payment: any = await PaymentService.getPayment(mp.data.id)

            //     console.log(payment.date_created)

            //     notifications.push(mp)
            // })

            this.res.data = notifications


            return response.status(this.res.code).json(this.res)
        } catch (error: any) {
            this.res.code = 500
            this.res.status = 'Error'
            this.res.message = error.message

            if (error.code === 'E_ROW_NOT_FOUND') {
                this.res.code = 404
                this.res.status = 'Not Found'
                this.res.message = 'Definitions not found'
            }

            return response.status(this.res.code).json(this.res)
        }
    }
}