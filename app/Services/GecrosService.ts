

import Database from '@ioc:Adonis/Lucid/Database'
import Config from '@ioc:Adonis/Core/Config'
import { Subjects } from 'App/Enums/Notifications'
import { DateTime } from "luxon"

export default class GecrosService {

    protected static baseUrl: string = Config.get('app.baseUrl')

    public static async signIn(username: string, password: string) {
        const settings = {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
            body: new URLSearchParams({
                client_id: 'gecrosAppAfiliado',
                grant_type: 'password',
                password: password,
                userName: username
            })
        }

        const response = await fetch(`${this.baseUrl}/connect/token`, settings)

        return {
            status: response.status,
            isSuccessful: response.ok,
            data: await response.json()
        }
    }

    public static async signUp(docType: number, docNumber: number, email: string) {

        const settings = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tipodocid: docType.toString(),
                nrodoc: docNumber.toString(),
                email: email,
                permitirregistrarsinemail: 'false',
                confirmemail: email,
                nroafiliado: docNumber.toString()
            })
        }

        const response = await fetch(`${this.baseUrl}/api/AppBenefUsers`, settings)

        return {
            status: response.status,
            isSuccessful: response.ok,
            data: await response.json()
        }
    }

    public static async forgotPassword(docType: number, docNumber: number, email: string) {

        const settings = {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tipodocid: docType.toString(),
                nrodoc: docNumber.toString(),
                email: email
            })
        }

        const response = await fetch(`${this.baseUrl}/api/AppBenefUsers/ForgotPassword`, settings)

        return {
            status: response.status,
            isSuccessful: response.ok,
            data: await response.json()
        }
    }


    public static async changePassword(currentPassword: string, newPassword: string, token: string) {

        const settings = {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                authorization: `bearer ${token}`
            },
            body: JSON.stringify({
                currentPassword: currentPassword,
                newPassword: newPassword,
            })
        }

        const response = await fetch(`${this.baseUrl}/api/AppBenefUsers/ChangePassword`, settings)

        return {
            status: response.status,
            isSuccessful: response.ok,
            data: await response.json()
        }
    }

    public static async getAffiliateById(benId: number = 0) {
        const response = await fetch(`${this.baseUrl}/api/Afiliados/AfiliadoById?benId=${benId}`)
            .then((response) => {
                return response.json()
            })

        return response.data
    }

    public static async getAffiliate(document: number) {
        const response = await fetch(`${this.baseUrl}/api/Afiliados?numero=${document}`)
            .then((response) => {
                return response.json()
            })

        return response.data[0]
    }

    public static async getAffiliateAuth(docType: number = 0, docNumber: number = 0) {

        const affiliate = await Database.connection('gecros').query()
            .from('benef')
            .select('ben_id', 'ben_gr_id', 'ben_ape', 'ben_nom', 'td_id', 'doc_id', 'cuil', 'ben_email')
            .where('td_id', docType)
            .where('doc_id', docNumber)
            .first()

        return {
            benId: parseInt(affiliate.ben_id),
            benGrId: parseInt(affiliate.ben_gr_id),
            tipo: parseInt(affiliate.td_id),
            documento: parseInt(affiliate.doc_id),
            cuil: affiliate.cuil,
            email: affiliate.ben_email.trim(),
            nombre: (affiliate.ben_nom.trim() + ' ' + affiliate.ben_ape.trim()).trim()
        }
    }

    public static async getFamilyGroup(benGrId: number = 0) {

        const query = await Database.connection('gecros').query()
            .from('benef')
            .join('parentescos', 'benef.par_id', '=', 'parentescos.par_id')
            .select(
                'benef.ben_id',
                'benef.ben_gr_id',
                'benef.ben_ape',
                'benef.ben_nom',
                'benef.doc_id',
                'benef.cuil',
                'parentescos.par_id',
                'parentescos.par_tit',
                'parentescos.par_cod',
                'parentescos.par_nombre')
            .where('benef.ben_gr_id', benGrId)

        return query.map(element => {
            return {
                benId: element.ben_id,
                benGrId: element.ben_gr_id,
                parId: element.par_id,
                documento: element.doc_id,
                cuil: element.cuil,
                nombre: (element.ben_nom.trim() + ' ' + element.ben_ape.trim()).trim(),
                titular: element.par_tit,
                parentesco: element.par_nombre
            }
        })
    }

    public static async getFamilyGroupOwner(benGrId: number = 0) {

        const owner = await Database.connection('gecros').query()
            .from('benef')
            .join('parentescos', 'benef.par_id', '=', 'parentescos.par_id')
            .select('benef.ben_id')
            .where('benef.ben_gr_id', benGrId)
            .where('parentescos.par_nombre', 'TITULAR')
            .firstOrFail()

        return await this.getAffiliateById(owner.ben_id)
    }
    public static async getDocumentTypes() {

        const documentTypes = await Database.connection('gecros').query()
            .from('tipodoc')
            .select('td_id', 'td_nombre')

        return documentTypes.map(element => {
            return {
                id: parseInt(element.td_id),
                value: element.td_nombre.trim()
            }
        })
    }

    public static async getDebtStatement(benId: number) {

        const affiliate = await Database.connection('gecros').query()
            .from('benef')
            .select('doc_id')
            .where('ben_id', benId)
            .first()

        const data = await fetch(`${this.baseUrl}/api/AgentesCuenta/Deuda/${affiliate.doc_id}`)
            .then((response) => {
                return response.json()
            })

        return data.map((element: any) => {
            const period = DateTime.fromFormat(element.ano_peri, 'MM/yyyy').setLocale('es')

            return {
                id: element.nrocom,
                period: parseInt(period.toFormat('yyyyMM')),
                periodString: period.toFormat('MMMM yyyy'),
                amount: Number(element.saldo.replace(/[^0-9.-]+/g, '')),
                debt: Number(element.deuda),
                net: Number(element.monto),
                duedate: element.fecven,
                name: element.compro
            }
        })
    }

    public static async getHistoryStatement(benId: number) {

        const data = await Database.connection('gecros').query()
            .from('compctacte')
            .join('tcompctacte', 'compctacte.tcomp_id', '=', 'tcompctacte.tcomp_id')
            .join('benefagecta', 'compctacte.agecta_id', '=', 'benefagecta.agecta_id')
            .join('benef', 'benefagecta.ben_gr_id', '=', 'benef.ben_gr_id')
            .select(
                'compctacte.comp_id',
                'compctacte.comp_peri',
                'compctacte.comp_total',
                'compctacte.comp_neto',
                'compctacte.comp_fecha',
                'compctacte.comp_fecven',
                'tcompctacte.tcomp_id',
                'tcompctacte.tcomp_nombre')
            .where('benef.ben_id', benId)
            .where('tcompctacte.tcomp_id', 3)
            .orderBy('compctacte.comp_fecha', 'desc')

        return data.map(element => {
            const dateTime = DateTime.fromFormat(element.comp_peri, 'yyyyMM').setLocale('es')

            return {
                id: element.comp_id,
                period: parseInt(element.comp_peri),
                periodString: dateTime.toFormat('MMMM yyyy'),
                dateTime: dateTime,
                amount: element.comp_total,
                net: element.comp_neto,
                date: DateTime.fromJSDate(element.comp_fecha).toUTC().toFormat('dd/MM/yyyy'),
                duedate: DateTime.fromJSDate(element.comp_fecven).toUTC().toFormat('dd/MM/yyyy'),
                name: element.tcomp_nombre
            }
        })

    }


    public static async getNotifications(benId: number, page: number) {

        const data = await Database.connection('gecros').query()
            .from('BenefUserNotifications')
            .join('BenefUsers', 'BenefUserNotifications.BenefUserToId', '=', 'BenefUsers.Id')
            .select(
                'BenefUserNotifications.Id',
                'BenefUserNotifications.Subject',
                'BenefUserNotifications.Body',
                'BenefUserNotifications.CreatedAt',
                'BenefUserNotifications.ReadAt',
                'BenefUserNotifications.SentAt')
            .where('BenefUsers.ben_id', benId)
            .orderBy('BenefUserNotifications.CreatedAt', 'desc')
            .paginate(page, 10)


        const notifications: any = [];
        const dateTimeNow = DateTime.now()

        data.forEach(function (element) {

            const dateTime = DateTime.fromJSDate(element.CreatedAt).setLocale('es')

            notifications.push({
                id: element.Id,
                subject: element.Subject.trim(),
                body: element.Body.trim(),
                read: element.ReadAt ? true : false,
                date: dateTimeNow.toISODate() === dateTime.toISODate() ? dateTime.toLocaleString(DateTime.TIME_24_SIMPLE) : dateTime.toFormat('dd MMM, yyyy'),
                humanDate: dateTime.toRelative(),
                createdAt: element.CreatedAt,
                readAt: element.ReadAt,
                sentAt: element.SentAt
            })

        })

        return {
            total: data.total,
            perPage: data.perPage,
            currentPage: data.currentPage,
            lastPage: data.lastPage,
            firstPage: data.firstPage,
            data: notifications
        }
    }

    public static async getAuthorizations(benId: number) {

        const dateTimeNow = DateTime.now()

        const data = await Database.connection('gecros').query()
            .from('BenefUserNotifications')
            .join('BenefUsers', 'BenefUserNotifications.BenefUserToId', '=', 'BenefUsers.Id')
            .select(
                'BenefUserNotifications.Id',
                'BenefUserNotifications.Subject',
                'BenefUserNotifications.Body',
                'BenefUserNotifications.CreatedAt',
                'BenefUserNotifications.ReadAt',
                'BenefUserNotifications.SentAt')
            .limit(2)
            .where('BenefUsers.ben_id', benId)
            .where('BenefUserNotifications.CreatedAt', '>', dateTimeNow.plus({ days: -90 }).toSQLDate())
            .whereIn('BenefUserNotifications.Subject', Object.keys(Subjects))
            .orderBy('BenefUserNotifications.CreatedAt', 'desc')

        return data.map(element => {
            const dateTime = DateTime.fromJSDate(element.CreatedAt).setLocale('es')

            return {
                id: element.Id,
                subject: element.Subject.trim(),
                body: element.Body.trim(),
                icon: Subjects[element.Subject] ?? 'check',
                read: element.ReadAt ? true : false,
                date: dateTimeNow.toISODate() === dateTime.toISODate() ? dateTime.toLocaleString(DateTime.TIME_24_SIMPLE) : dateTime.toFormat('dd MMM, yyyy'),
                humanDate: dateTime.toRelative(),
            }
        })
    }
}