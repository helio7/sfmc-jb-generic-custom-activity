'use strict';
import https from 'https';
import axios from 'axios';
import { Request } from 'express';
import { Response } from 'express';
import { verify } from 'jsonwebtoken';

const logExecuteData: {
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
}[] = [];

const saveData = (req: any) => {
  // Put data from the request in an array accessible to the main app.
  exports.logExecuteData.push({
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
  cellularNumber: number;
  channel: string;
}

interface ResponseBody {
  responseCode: number;
  responseMessage: string;
  handle: number;
//   {
//     code: number,
//     description: string
// }
  pack: {
    packId: string,
    description: string
}[];
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
        const { value, expiresAt } = req.app.locals.token;
        let cellularNumber: string | null = null;
        let channel: string | null = null;
        for (const argument of decoded.inArguments) {
          if (argument.cellularNumber) cellularNumber = argument.cellularNumber;
          else if (argument.channel) channel = argument.channel;
          if (channel && cellularNumber) break;
        }
        if (!channel || !cellularNumber ) return res.status(400).send('Input parameter is missing.');

        const now = new Date();

        let balanceValidationFailed = false;
        const offersRequestDurationTimestamps: DurationTimestampsPair = { start: performance.now(), end: null };


        const httpsAgent = new https.Agent({ rejectUnauthorized: false });

        // if (value === null || expiresAt < now) {
        //   const { TOKEN_API_URL, TOKEN_API_USERNAME, TOKEN_API_PASSWORD } = process.env;
  
        //   console.log('GETTING TOKEN...');
        //   const token: string = await axios({
        //     method: 'post',
        //     url: TOKEN_API_URL,
        //     data: {
        //       username: TOKEN_API_USERNAME,
        //       password: TOKEN_API_PASSWORD
        //     },
        //     httpsAgent,
        //   })
        //     .then((res: any) => {
        //       console.log('Token obtained.');
        //       if (res.headers.authorization) return res.headers.authorization.substring(7);
        //     })
        //     .catch((err: any) => {
        //       console.log('Error:');
        //       console.log(err);
        //     });
        //   if (!token) balanceValidationFailed = true;
        //   else {
        //     req.app.locals.token = {
        //       value: token,
        //       expiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 23),
        //     };
        //   }
        // }

        // let accountBalance = 0.0;
  
        // if (!balanceValidationFailed) {
          const {
            API_URL,
            API_SESSION_ID,
            API_COUNTRY
          } = process.env;
  
        //   let phone: string | null = null;
        //   for (const argument of decoded.inArguments) {
        //     if (argument.phone) {
        //       phone = argument.phone;
        //       break;
        //     }
        //   }
        //   if (!phone)  return res.status(400).send('Input parameter is missing.');
  
          // console.log('Getting balance data...');
          
          const offersApiResponse: { data: ResponseBody } | null = await axios({
            method: 'post',
            url: API_URL,
            data: {
                cellularNumber: Number(cellularNumber),
                channel: channel
            } as RequestBody,
            headers: {
                Country: API_COUNTRY,
                'Session-Id': API_SESSION_ID
            },
            httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        })
            .catch((err) => {
                offersRequestDurationTimestamps.end = performance.now();
                if (err.response) {
                    const { data, status } = err.response;
                    // specialConsoleLog({
                    //     phoneNumber: cellularNumber!,
                    //     eventName: 'OFFERS_REQUEST_FAILED',
                    //     durationTimestamps: offersRequestDurationTimestamps,
                    //     data: { data, status },
                    // });
                }
                console.log('Error when calling the offers API:');
                console.log(err);
                return null;
            });
        offersRequestDurationTimestamps.end = performance.now();

          // const saldoBalancesApiResponse = await axios({
          //   method: 'post',
          //   url: API_URL,
          //   headers: {
          //     Authorization: `Bearer ${req.app.locals.token.value}`,
          //     Country: API_COUNTRY,
          //   'Session-Id': API_SESSION_ID
          //   },
          //   httpsAgent,
          // })
          //   .then((res: any) => {
          //     console.log('Response');
          //     console.log(res.data);
          //     return res.data;
          //   })
          //   .catch((err: any) => {
          //     console.log('Error:');
          //     console.log(err);
          //   });
          // if (!saldoBalancesApiResponse) balanceValidationFailed = true;
          // else accountBalance = saldoBalancesApiResponse.balancesDetails.accountBalance;
        }
        
  
      //   res.status(200).send({
      //     accountBalance,
      //     balanceValidationFailed,
      //   });
      // } else {
      //   console.error('inArguments invalid.');
      //   return res.status(400).end();
      // }
    },
  );
};

const edit = (req: any, res: any) => {
  saveData(req);
  res.send(200, 'Edit');
};

const save = (req: any, res: any) => {
  saveData(req);
  res.send(200, 'Save');
};

const publish = (req: any, res: any) => {
  saveData(req);
  res.send(200, 'Publish');
};

const validate = (req: any, res: any) => {
  saveData(req);
  res.send(200, 'Validate');
};

const stop = (req: any, res: any) => {
  saveData(req);
  res.send(200, 'Stop');
};

export default {
  logExecuteData,
  execute,
  edit,
  save,
  publish,
  validate,
  stop,
};