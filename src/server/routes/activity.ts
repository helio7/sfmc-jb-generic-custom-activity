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
    dataExtension?: string;
}
interface DecodedBody {
    inArguments?: InputParamenter[];
}
interface DurationTimestampsPair {
    start: number | null;
    end: number | null;
}

interface PackRenovRequestBody {
    cellularNumber: number;
    channel: string;
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

                let dataExtension: string | null = null;
                let channel: string | null = null;
                let packsType: PacksType | null = null;
                let cellularNumber: string | null = null;
                let packId: string | null = null;
                let packPrice: number | null = null;
                let balanceMessageTemplate: string | null = null;
                let defaultPackId: string | null = null;
                let defaultPackMessageTemplate: string | null = null;
                let defaultPackKeyword: string | null = null;
                for (const argument of decoded.inArguments) {
                    if (argument.dataExtension) dataExtension = argument.dataExtension;
                    if (argument.channel) channel = argument.channel;
                    if (argument.packsType) packsType = argument.packsType;
                    if (argument.cellularNumber) cellularNumber = argument.cellularNumber;
                    if (argument.packId !== undefined) packId = argument.packId;
                    if (argument.packPrice !== undefined) packPrice = Number(argument.packPrice);
                    if (argument.balanceMessageTemplate !== undefined) balanceMessageTemplate = argument.balanceMessageTemplate;
                    if (argument.defaultPackId !== undefined) defaultPackId = argument.defaultPackId;
                    if (argument.defaultPackMessageTemplate !== undefined) defaultPackMessageTemplate = argument.defaultPackMessageTemplate;
                    if (argument.defaultPackKeyword !== undefined) defaultPackKeyword = argument.defaultPackKeyword;
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

                
                console.log('Llamando a API de PR');
                const packRenovableApiResponse: { data: PackRenovRequestBody } | null = await axios({
                    method: 'post',
                    url: API_URL,
                    data: {
                        cellularNumber: body.cellularNumber,
                        channel: body.channel
                    } as PackRenovRequestBody,
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

                let message: string | null = null;
                let messageTemplate: string | null = null;
                let packIdToSearchFor: string | null = null;

                console.log('Llamando packsFound');
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
                console.log('Resultado:');
                console.log(packsFound);

                const {
                    DESCUENTO,
                    CAPACIDAD_UNIDAD_PACK,
                    VIGENCIA,
                    PRECIO_FINAL,
                } = packsFound[0];

                console.log('Crea el message');
                // Verifica que messageTemplate no sea null y sea de tipo string
                if (messageTemplate && typeof messageTemplate === 'string') {
                    // Usa el operador 'as' para forzar el tipo de messageTemplate a 'string'
                    message = (messageTemplate as string)
                        .trim()
                        .replace('#D#', String(DESCUENTO))
                        .replace('#C#', CAPACIDAD_UNIDAD_PACK)
                        .replace('#V#', `${VIGENCIA} ${VIGENCIA > 1 ? 'dias' : 'dia'}`)
                        .replace('#P#', String(PRECIO_FINAL))
                        .replace('#K#', defaultPackKeyword);
                }

                const output: CaResponse = {
                    ...response,
                    mensajeTraducido: message ?? '',
                    status: CALIFICADO,
                    motivo: '',
                };

                console.log('Output:');
                console.log(output);

                return res.status(200).send(output);
            }
        }
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
