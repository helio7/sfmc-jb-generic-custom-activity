'use strict';
import { Request, Response } from "express";
import { performance } from "perf_hooks";
import { verify } from 'jsonwebtoken';
import uuid from 'uuid-random';
import https from 'https';
import axios from 'axios';
import { dataSource } from "../app-data-source";
import { Pack } from "../entities/pack.entity";

interface ExecuteLog {
    body: any;
    headers: any;
    trailers: any;
    method: any;
    url: any;
    params: any;
    query: any;
    route: any;
    cookies: any;
    ip: any;
    path: any;
    host: any;
    fresh: any;
    stale: any;
    protocol: any;
    secure: any;
    originalUrl: any;
}
const logExecuteData: ExecuteLog[] = [];
const logData = (req: Request) => {
    logExecuteData.push({
        body: req.body,
        headers: req.headers,
        trailers: req.trailers,
        method: req.method,
        url: req.url,
        params: req.params,
        query: req.query,
        route: req.route,
        cookies: req.cookies,
        ip: req.ip,
        path: req.path,
        host: req.host,
        fresh: req.fresh,
        stale: req.stale,
        protocol: req.protocol,
        secure: req.secure,
        originalUrl: req.originalUrl
    });
}

interface InputParamenter {
    cellularNumber?: string;
}
interface DecodedBody {
    inArguments?: InputParamenter[];
}
interface DurationTimestampsPair {
    start: number | null;
    end: number | null;
}

interface RequestBody {
    cellularNumber: number;
    channel: string;
}

interface PrestaRequestBody {
    description: string;
    externalId: string;
    provideAlternative: boolean;
    provideOnlyAvailable: boolean;
    provideUnavailabilityReason: boolean;
    relatedParty: { id: string }[];
    serviceQualificationItem: {
        service: {
            serviceCharacteristic: { name: string; value: string; }[];
            serviceSpecification: { id: number; name: string; };
        }[];
    }[];
}

interface PrestaResponseBody {
    baseType: string;
    description: string;
    effectiveQualificationDate: string;
    estimatedResponseDate: string;
    externalId: string;
    href: string;
    id: string;
    provideAlternative: boolean;
    provideOnlyAvailable: boolean;
    provideUnavailabilityReason: boolean;
    qualificationResult: 'qualified' | 'alternate' | 'unqualified' | 'error';
    relatedParty: { id: string }[];
    serviceQualificationDate: string;
    serviceQualificationItem: {
        expectedServiceAvailablilityDate: string;
        state: string;
        qualificationItemResult: string;
        type: string;
        eligibilityUnavailabilityReason: { code: string; label: string }[];
        service: {
            href: string;
            id: string;
            serviceCharacteristic: { name: string; value: string }[];
            serviceSpecification: { id: string; name: string }[];
            relatedParty: { id: string; name: string; role: string }[];
        }[];
        alternateServiceProposal?: {
            id: string;
            type: string;
            service: {
                id: string;
                serviceCharacteristic: {
                    name: string;
                    value: string;
                }[];
            }[];
        }[];
    }[];
    state: string;
    type: string;
}

interface AlternativeOption {
    type?: string,
    amount?: number,
    serviceCost?: number,
    freeServiceCostDays?: number,
}

interface AlternativeBalanceOption extends AlternativeOption {
    loanDuration?: number,
}

interface AlternativePackOption extends AlternativeOption {
    packId?: string,
    units?: string,
    lengthDays?: number,
}

enum PacksType {
    REN_GIG = 'ren_gig',
    UPC = 'upc',
    MS = 'ms',
    COM_SCO = 'com_sco',
}

enum CA_STATUS_RESULT {
    ERROR = 'error',
    CALIFICADO = 'Calificado',
    NO_CALIFICADO = 'No Calificado',
    CALIFICA_SIN_SALDO = 'Califica sin saldo',
}

interface CaResponse {
    mensajeTraducido: string,
    status: CA_STATUS_RESULT,
    motivo: string
}

const execute = async function (req: Request, res: Response) {
    const { body } = req;
    const { env: { JWT_SECRET } } = process;

    if (!body) {
        console.error(new Error('invalid jwtdata'));
        return res.status(401).end();
    }
    if (!JWT_SECRET) {
        console.error(new Error('jwtSecret not provided'));
        return res.status(401).end();
    }

    verify(
        body.toString('utf8'),
        JWT_SECRET,
        { algorithms: ['HS256'], complete: false },
        async (err: any, decoded?: any) => {
            if (err) {
                console.error(err);
                return res.status(401).end();
            }
            if (decoded && decoded.inArguments && decoded.inArguments.length > 0) {
                const { ERROR, CALIFICA_SIN_SALDO, NO_CALIFICADO, CALIFICADO } = CA_STATUS_RESULT;
                let ValidationFailed = false;
                const httpsAgent = new https.Agent({ rejectUnauthorized: false });



                const response: CaResponse = {
                    mensajeTraducido: '',
                    status: ERROR,
                    motivo: ''
                };

                let packRenovResponse;

                let packsType: PacksType | null = null;
                let cellularNumber: string | null = null;
                let packId: string | null = null;
                let packPrice: number | null = null;
                let balanceMessageTemplate: string | null = null;
                let defaultPackId: string | null = null;
                let defaultPackMessageTemplate: string | null = null;
                let defaultPackKeyword: string | null = null;
                // let externalIdPrefix: string | null = null;
                for (const argument of decoded.inArguments) {
                    if (argument.packsType) packsType = argument.packsType;
                    if (argument.cellularNumber) cellularNumber = argument.cellularNumber;
                    // if (argument.balance !== undefined) clientBalance = Number(argument.balance);
                    if (argument.packId !== undefined) packId = argument.packId;
                    if (argument.packPrice !== undefined) packPrice = Number(argument.packPrice);
                    if (argument.balanceMessageTemplate !== undefined) balanceMessageTemplate = argument.balanceMessageTemplate;
                    if (argument.defaultPackId !== undefined) defaultPackId = argument.defaultPackId;
                    if (argument.defaultPackMessageTemplate !== undefined) defaultPackMessageTemplate = argument.defaultPackMessageTemplate;
                    if (argument.defaultPackKeyword !== undefined) defaultPackKeyword = argument.defaultPackKeyword;
                    // if (argument.externalIdPrefix !== undefined) externalIdPrefix = argument.externalIdPrefix;
                }
                if (
                    !packsType || !cellularNumber ||
                    !packId || typeof packPrice !== 'number' ||
                    (!balanceMessageTemplate && packsType !== PacksType.REN_GIG && packId.substring(0, 2) !== 'PR') ||
                    !defaultPackId || !defaultPackMessageTemplate || !defaultPackKeyword
                ) {
                    return res.status(200).send({
                        ...response,
                        motivo: 'Input parameter is missing.',
                        prestaOfertado: packId ? packId : '',
                        precioPackOfertado: typeof packPrice !== 'number' ? packPrice : 0,
                    } as CaResponse);
                }

                const { UPC, MS, REN_GIG, COM_SCO } = PacksType;
                const {
                    API_URL,
                    API_SESSION_ID,
                    API_COUNTRY
                } = process.env;

                if (![UPC, MS, REN_GIG, COM_SCO].includes(packsType)) {
                    const errorMessage = `Invalid packs type: ${packsType}`;
                    console.log(errorMessage);
                    return res.status(200).end({ ...response, motivo: errorMessage } as CaResponse);
                }

                // if (!externalIdPrefix) externalIdPrefix = 'CLARO-TEST';

                const prestaRequestDurationTimestamps: DurationTimestampsPair = { start: performance.now(), end: null };
                let requestErrorHappened = false;
                // const prestaVerificationResponse = await axios.post<PrestaResponseBody>(
                //     `${PRESTA_API_URL}/serviceQualificationManagement/v3/servicequalification`,
                //     {
                //         description: `Service Qualification ${cellularNumber}`,
                //         externalId: `[${externalIdPrefix}]-${uuid()}`,
                //         provideAlternative: true,
                //         provideOnlyAvailable: true,
                //         provideUnavailabilityReason: true,
                //         relatedParty: [{ id: cellularNumber }],
                //         serviceQualificationItem: [
                //             {
                //                 service: [
                //                     {
                //                         serviceCharacteristic: [
                //                             {
                //                                 name: 'channel',
                //                                 value: 'CPAY',
                //                             },
                //                         ],
                //                         serviceSpecification: {
                //                             id: 0,
                //                             name: 'PRESTA',
                //                         },
                //                     },
                //                 ],
                //             },
                //         ],
                //     } as PrestaRequestBody,
                //     { httpsAgent: new https.Agent({ rejectUnauthorized: false }) },
                // )
                //     .catch((error: any) => {
                //         requestErrorHappened = true;
                //         prestaRequestDurationTimestamps.end = performance.now();
                //         if (error.response) {
                //             const { data, status } = error.response;
                //             specialConsoleLog(
                //                 cellularNumber!,
                //                 'PRESTA_REQUEST_FAILED',
                //                 prestaRequestDurationTimestamps,
                //                 { data, status },
                //             );
                //             console.log('Error:');
                //             console.log(`Status: ${status}`);
                //             console.log(`Data: ${JSON.stringify(data)}`);
                //         } else console.log(error);
                //     });
                // prestaRequestDurationTimestamps.end = performance.now();


                const packRenovableApiResponse: { data: RequestBody } | null = await axios({
                    method: 'post',
                    url: API_URL,
                    data: {
                        cellularNumber: body.cellularNumber,
                        channel: body.channel
                    } as RequestBody,
                    headers: {
                        Country: API_COUNTRY!,
                        'Session-Id': API_SESSION_ID!
                    },
                    httpsAgent,
                })
                    .then((res: any) => {
                        console.log('Response');
                        console.log(res.data);
                        packRenovResponse = res.data
                        return packRenovResponse;
                    })
                    .catch((err: any) => {
                        console.log('Error:');
                        console.log(err);

                    });
                if (!packRenovableApiResponse) ValidationFailed = true;

                // if (requestErrorHappened) {
                //     return res.status(200).send({ ...response, motivo: 'Presta qualification request failed.' } as CaResponse);
                // }
                // if (
                //     typeof(prestaVerificationResponse) === 'undefined' ||
                //     !prestaVerificationResponse.data ||
                //     !prestaVerificationResponse.data.qualificationResult
                // ) {
                //     return res.status(200).send({
                //         ...response,
                //         motivo: 'No data found in presta qualification response.'
                //     } as CaResponse);
                // }

                // const prestaQualificationResult = prestaVerificationResponse.data.qualificationResult;

                let message: string | null = null;
                let prestaIncentivado: string = '';
                let montoPresta: number = 0;
                let precioPackIncentivado: number = packPrice;

                // switch (prestaQualificationResult) {
                // case 'qualified':
                // case 'alternate':
                // let serverError: string | null = null
                // if (!prestaVerificationResponse.data.serviceQualificationItem) {
                //     serverError = 'Presta response is missing the "serviceQualificationItem" property';
                // }
                // if (!prestaVerificationResponse.data.serviceQualificationItem[0]) {
                //     serverError = 'Presta response is missing elements in the "serviceQualificationItem" property';
                // }
                // if (!prestaVerificationResponse.data.serviceQualificationItem[0].alternateServiceProposal) {
                //     serverError = 'Presta response is missing the "alternateServiceProposal" property';
                // }
                // if (serverError) {
                //     return res.status(200).send({ ...response, motivo: serverError } as CaResponse);
                // }

                const balanceOptions: AlternativeBalanceOption[] = [];
                let packOption: AlternativePackOption | null = null;

                // for (const alternateServiceProposal of prestaVerificationResponse.data.serviceQualificationItem[0].alternateServiceProposal!) {
                //     const alternativeOption: any = {};

                //     for (const serviceCharacteristic of alternateServiceProposal.service[0].serviceCharacteristic) {
                //         switch (serviceCharacteristic.name) {
                //             case 'type':
                //                 alternativeOption.type = serviceCharacteristic.value;
                //                 break;
                //             case 'loanDuration':
                //                 alternativeOption.loanDuration = Number(serviceCharacteristic.value);
                //                 break;
                //             case 'amount':
                //                 const amount = Number(serviceCharacteristic.value);
                //                 if (typeof amount !== 'number') {
                //                     return res.status(200).send({
                //                         ...response,
                //                         motivo: `Invalid service characteristic 'amount' value: ${serviceCharacteristic.value}`,
                //                     } as CaResponse);
                //                 }
                //                 alternativeOption.amount = Number(serviceCharacteristic.value);
                //                 break;
                //             case 'serviceCost':
                //                 alternativeOption.serviceCost = Number(serviceCharacteristic.value);
                //                 break;
                //             case 'freeServiceCostDays':
                //                 alternativeOption.freeServiceCostDays = Number(serviceCharacteristic.value);
                //                 break;
                //             case 'packId':
                //                 alternativeOption.packId = serviceCharacteristic.value;
                //                 break;
                //             case 'units':
                //                 alternativeOption.units = serviceCharacteristic.value;
                //                 break;
                //             case 'lengthDays':
                //                 alternativeOption.lengthDays = Number(serviceCharacteristic.value);
                //                 break;
                //             default:
                //                 break;
                //         }
                //     }

                //     if (alternativeOption.type === 'BALANCES') balanceOptions.push(alternativeOption);
                //     else if (alternativeOption.type === 'PACKS_DATA') packOption = alternativeOption;
                // }

                // balanceOptions
                //     .sort((a, b) => { // Ascendent order
                //         if (a.amount! < b.amount!) return -1;
                //         else if (a.amount! > b.amount!) return 1;
                //         return 0;
                //     })

                // let optionToEncourage: AlternativeBalanceOption | AlternativePackOption | null = null;

                // if (packsType === PacksType.REN_GIG && packId.substring(0, 2) === 'PR') {
                //     optionToEncourage = packOption;
                // } else {
                //     for (const balanceOption of balanceOptions) {
                //         if (clientBalance + balanceOption.amount! >= packPrice) {
                //             optionToEncourage = balanceOption;
                //             break;
                //         }
                //     }
                // }

                // if (!optionToEncourage) {
                //     if (!packOption) {
                //         return res.status(200).send({ ...response, status: CALIFICA_SIN_SALDO } as CaResponse);
                //     }
                //     optionToEncourage = packOption;
                // }

                let messageTemplate: string | null = null;
                let packIdToSearchFor: string | null = null;

                // if (optionToEncourage.type === 'BALANCES') {
                //     messageTemplate = balanceMessageTemplate!;
                //     packIdToSearchFor = packId;
                //     prestaIncentivado = packId;
                //     if (optionToEncourage.amount) montoPresta = optionToEncourage.amount;
                // }
                // else if (optionToEncourage.type === 'PACKS_DATA') {
                //     messageTemplate = defaultPackMessageTemplate;
                //     packIdToSearchFor = defaultPackId;
                //     prestaIncentivado = defaultPackId;
                //     if (optionToEncourage.amount) precioPackIncentivado = optionToEncourage.amount;
                // }
                // else {
                //     return res.status(200).send({
                //         ...response,
                //         motivo: `Invalid pack type in option to encourage: ${optionToEncourage.type}`,
                //     } as CaResponse);
                // }

                const packsFound: {
                    PACK_ID: string,
                    PRECIO_FINAL: number,
                    VIGENCIA: number,
                    CAPACIDAD_UNIDAD_PACK: string,
                    DESCUENTO: number,
                }[] = await dataSource.getRepository(Pack).query(`
                            select
                                PACK_ID,
                                DESCUENTO,
                                CAPACIDAD_UNIDAD_PACK,
                                VIGENCIA,
                                PRECIO_FINAL
                            from SF_PACKS_TARIFF_PREPAGO
                            where PACK_ID = '${packIdToSearchFor}'
                        `);

                if (!packsFound.length) {
                    return res.status(200).send({
                        ...response, motivo: `Pack ${packIdToSearchFor} not found in DB.`
                    } as CaResponse);
                }

                const {
                    DESCUENTO,
                    CAPACIDAD_UNIDAD_PACK,
                    VIGENCIA,
                    PRECIO_FINAL,
                } = packsFound[0];

                message = messageTemplate
                    .trim()
                    .replace('#D#', String(DESCUENTO))
                    .replace('#C#', CAPACIDAD_UNIDAD_PACK)
                    .replace('#V#', `${VIGENCIA} ${VIGENCIA > 1 ? 'dias' : 'dia'}`)
                    .replace('#P#', String(PRECIO_FINAL))
                    .replace('#K#', defaultPackKeyword);

                //     break;
                // case 'unqualified':
                // case 'error':
                // return res.status(200).send({
                //     ...response, status: NO_CALIFICADO, motivo: 'Unqualified or error.'
                // } as CaResponse);
                // default:
                return res.status(200).send({
                    ...response,
                    // motivo: `Unknown 'prestaQualificationResult' value: ${prestaQualificationResult}`,
                } as CaResponse);

                const output: CaResponse = {
                    ...response,
                    mensajeTraducido: message,
                    status: CALIFICADO,
                    motivo: ''
                };

            }
        

            return res.status(200).send(output);
    //     } else {
    //     console.error('inArguments invalid.');
    //     return res.status(400).end();
    // }
        },
    );
};

const edit = (req: any, res: any) => {
    logData(req);
    res.send(200, 'Edit');
};

const save = (req: any, res: any) => {
    logData(req);
    res.send(200, 'Save');
};

const publish = (req: any, res: any) => {
    logData(req);
    res.send(200, 'Publish');
};

const validate = (req: any, res: any) => {
    logData(req);
    res.send(200, 'Validate');
};

const stop = (req: any, res: any) => {
    logData(req);
    res.send(200, 'Stop');
};

function millisToMinutesAndSeconds(millis: number): string {
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return Number(seconds) == 60 ? minutes + 1 + 'm' : minutes + 'm ' + (Number(seconds) < 10 ? '0' : '') + seconds + 's';
}

function specialConsoleLog(
    phoneNumber: string,
    eventName: string,
    durationTimestamps: DurationTimestampsPair,
    data: any,
): void {
    const now = new Date();
    const todayDate = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    const currentTime = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;

    const { start, end } = durationTimestamps;
    let duration = '-';
    if (start && end) duration = millisToMinutesAndSeconds(end - start);

    const jsonifiedData = JSON.stringify(data);

    console.log(`${todayDate}|${currentTime}|${phoneNumber}|${eventName}|${duration}|${jsonifiedData}`);
}

export default {
    logExecuteData,
    execute,
    edit,
    save,
    publish,
    validate,
    stop,
};
