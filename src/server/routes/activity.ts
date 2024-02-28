// 'use strict';
// import https from 'https';
// import axios from 'axios';
// import { Request } from 'express';
// import { Response } from 'express';
// import { verify } from 'jsonwebtoken';

// const logExecuteData: {
//   body: any;
//   headers: any;
//   trailers: any;
//   method: any;
//   url: any;
//   params: any;
//   query: any;
//   route: any;
//   cookies: any;
//   ip: any;
//   path: any;
//   host: any;
//   fresh: any;
//   stale: any;
//   protocol: any;
//   secure: any;
//   originalUrl: any;
// }[] = [];

// const saveData = (req: any) => {
//   // Put data from the request in an array accessible to the main app.
//   exports.logExecuteData.push({
//     body: req.body,
//     headers: req.headers,
//     trailers: req.trailers,
//     method: req.method,
//     url: req.url,
//     params: req.params,
//     query: req.query,
//     route: req.route,
//     cookies: req.cookies,
//     ip: req.ip,
//     path: req.path,
//     host: req.host,
//     fresh: req.fresh,
//     stale: req.stale,
//     protocol: req.protocol,
//     secure: req.secure,
//     originalUrl: req.originalUrl
//   });
// }

// interface InputParamenter {
//   phone?: string;
// }
// interface DecodedBody {
//   inArguments?: InputParamenter[];
// }

// const execute = async function (req: Request, res: Response) {
//   const { body } = req;
//   const { env: { JWT_SECRET } } = process;

//   if (!body) {
//     console.error(new Error('invalid jwtdata'));
//     return res.status(401).end();
//   }
//   if (!JWT_SECRET) {
//     console.error(new Error('jwtSecret not provided'));
//     return res.status(401).end();
//   }

//   verify(
//     body.toString('utf8'),
//     JWT_SECRET,
//     { algorithms: ['HS256'], complete: false },
//     async (err: any, decoded?: any) => {
//       if (err) {
//         console.error(err);
//         return res.status(401).end();
//       }
//       if (decoded && decoded.inArguments && decoded.inArguments.length > 0) {
//         const { value, expiresAt } = req.app.locals.token;

//         const now = new Date();

//         let balanceValidationFailed = false;

//         const httpsAgent = new https.Agent({ rejectUnauthorized: false });

//         if (value === null || expiresAt < now) {
//           const { TOKEN_API_URL, TOKEN_API_USERNAME, TOKEN_API_PASSWORD } = process.env;

//           //   console.log('GETTING TOKEN...');
//           //   const token: string = await axios({
//           //     method: 'post',
//           //     url: TOKEN_API_URL,
//           //     data: {
//           //       username: TOKEN_API_USERNAME,
//           //       password: TOKEN_API_PASSWORD
//           //     },
//           //     httpsAgent,
//           //   })
//           //     .then((res: any) => {
//           //       console.log('Token obtained.');
//           //       if (res.headers.authorization) return res.headers.authorization.substring(7);
//           //     })
//           //     .catch((err: any) => {
//           //       console.log('Error:');
//           //       console.log(err);
//           //     });
//           //   if (!token) balanceValidationFailed = true;
//           //   else {
//           //     req.app.locals.token = {
//           //       value: token,
//           //       expiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 23),
//           //     };
//           //   }
//           }

//           let accountBalance = 0.0;

//           if (!balanceValidationFailed) {
//             const {
//               API_URL,
//               API_SESSION_ID,
//               API_COUNTRY,
//             } = process.env;

//             let phone: string | null = null;
//             for (const argument of decoded.inArguments) {
//               if (argument.phone) {
//                 phone = argument.phone;
//                 break;
//               }
//             }
//             if (!phone) return res.status(400).send('Input parameter is missing.');

//             console.log('Getting balance data...');
//             const packRenovableApiResponse = await axios({
//               method: 'post',
//               url: API_URL,
//               headers: {
//                 Country: API_COUNTRY,
//                 'Session-Id': API_SESSION_ID
//               },
//               httpsAgent,
//             })
//               .then((res: any) => {
//                 console.log('Response');
//                 console.log(res.data);
//                 return res.data;
//               })
//               .catch((err: any) => {
//                 console.log('Error:');
//                 console.log(err);
//               });
//             if (!packRenovableApiResponse) balanceValidationFailed = true;
//             else accountBalance = packRenovableApiResponse.balancesDetails.accountBalance;
//           }
//           // const { responseCode, responseMessage, packId, handle } = packRenovableApiResponse.data;
//           // return { responseCode, responseMessage, packId, handle };

//           res.status(200).send({
//             accountBalance,
//             balanceValidationFailed,
//           });
//         } else {
//           console.error('inArguments invalid.');
//           return res.status(400).end();
//         }
//       },
//   );
// };

// const edit = (req: any, res: any) => {
//   saveData(req);
//   res.send(200, 'Edit');
// };

// const save = (req: any, res: any) => {
//   saveData(req);
//   res.send(200, 'Save');
// };

// const publish = (req: any, res: any) => {
//   saveData(req);
//   res.send(200, 'Publish');
// };

// const validate = (req: any, res: any) => {
//   saveData(req);
//   res.send(200, 'Validate');
// };

// const stop = (req: any, res: any) => {
//   saveData(req);
//   res.send(200, 'Stop');
// };

// export default {
//   logExecuteData,
//   execute,
//   edit,
//   save,
//   publish,
//   validate,
//   stop,
// };

'use strict';
import { Request, Response } from "express";
import { verify } from 'jsonwebtoken';


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
const logData = (req: Request) => { // Log data from the request and put it in an array accessible to the main app.
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
    dataExtension?:string;
    channel?: string;
}
interface DecodedBody {
    inArguments?: InputParamenter[];
}
interface DurationTimestampsPair {
    start: number | null;
    end: number | null;
}

interface RequestBody { 
    API_URL: number;
    API_COUNTRY: string;
    API_SESSION_ID: number;
}

interface ResponseBody {
    responseCode: number;
    responseMessage: string;
    packId: string;
    handle : number
}

const execute = async function (req: Request, res: Response) {
    const { body } = req;
    const { env: { JWT_SECRET } } = process;

    console.log('AAAAAA')

    if (!body) {
        console.error(new Error('invalid jwtdata'));
        return res.status(401).end();
    }
    if (!JWT_SECRET) {
        console.error(new Error('jwtSecret not provided'));
        return res.status(401).end();
    }

    // verify( 
    //     body.toString('utf8'),
    //     JWT_SECRET,
    //     { algorithms: ['HS256'], complete: false },
    //     async (err: any, decoded?: DecodedBody) => {
    //         if (err) {
    //             console.error(err);
    //             return res.status(401).end();
    //         }
    //         if (decoded && decoded.inArguments && decoded.inArguments.length > 0) {
    //             console.log('BBBBB')
    //             console.log('decoded', decoded)

    //             return res.status(200).send({responseCode, responseMessage,packId,handle});

    //         } else {
    //             console.error('inArguments invalid.');
    //             return res.status(400).end();
    //         }

    //     },
    // );
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

function specialConsoleLog (
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
