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
  phone?: string;
}
interface DecodedBody {
  inArguments?: InputParamenter[];
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

        const now = new Date();

        let balanceValidationFailed = false;

        const httpsAgent = new https.Agent({ rejectUnauthorized: false });

        if (value === null || expiresAt < now) {
          const { TOKEN_API_URL, TOKEN_API_USERNAME, TOKEN_API_PASSWORD } = process.env;
  
          console.log('GETTING TOKEN...');
          const token: string = await axios({
            method: 'post',
            url: TOKEN_API_URL,
            data: {
              username: TOKEN_API_USERNAME,
              password: TOKEN_API_PASSWORD
            },
            httpsAgent,
          })
            .then((res: any) => {
              console.log('Token obtained.');
              if (res.headers.authorization) return res.headers.authorization.substring(7);
            })
            .catch((err: any) => {
              console.log('Error:');
              console.log(err);
            });
          if (!token) balanceValidationFailed = true;
          else {
            req.app.locals.token = {
              value: token,
              expiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 23),
            };
          }
        }

        let accountBalance = 0.0;
  
        if (!balanceValidationFailed) {
          const {
            BALANCES_API_URL,
            BALANCES_API_SESSION_ID,
            BALANCES_API_CHANNEL,
            BALANCES_API_SERVICE,
          } = process.env;
  
          let phone: string | null = null;
          for (const argument of decoded.inArguments) {
            if (argument.phone) {
              phone = argument.phone;
              break;
            }
          }
          if (!phone) return res.status(400).send('Input parameter is missing.');
  
          console.log('Getting balance data...');
          const saldoBalancesApiResponse = await axios({
            method: 'get',
            url: BALANCES_API_URL,
            headers: {
              Authorization: `Bearer ${req.app.locals.token.value}`,
              'Session-Id': BALANCES_API_SESSION_ID,
              Channel: BALANCES_API_CHANNEL,
              Service: BALANCES_API_SERVICE,
              SubId: `549${phone}`,
            },
            httpsAgent,
          })
            .then((res: any) => {
              console.log('Response');
              console.log(res.data);
              return res.data;
            })
            .catch((err: any) => {
              console.log('Error:');
              console.log(err);
            });
          if (!saldoBalancesApiResponse) balanceValidationFailed = true;
          else accountBalance = saldoBalancesApiResponse.balancesDetails.accountBalance;
        }
  
        res.status(200).send({
          accountBalance,
          balanceValidationFailed,
        });
      } else {
        console.error('inArguments invalid.');
        return res.status(400).end();
      }
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