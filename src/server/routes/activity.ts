'use strict';
import https from 'https';
import axios from 'axios';
import { Request } from 'express';
import { Response } from 'express';
import { verify } from 'jsonwebtoken';

interface LogData {
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

const logExecuteData: LogData[] = [];

const saveData = (req: Request) => {
  // Put data from the request in an array accessible to the main app.
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
    host: req.hostname,
    fresh: req.fresh,
    stale: req.stale,
    protocol: req.protocol,
    secure: req.secure,
    originalUrl: req.originalUrl
  });
};

interface InputParamenter {
  phone?: string;
}
interface DecodedBody {
  inArguments?: InputParamenter[];
}

const execute = async function (req: Request, res: Response) {
  const { body } = req;
  const { env: { JWT_SECRET, TOKEN_API_URL, TOKEN_API_USERNAME, TOKEN_API_PASSWORD, API_URL, API_SESSION_ID, API_COUNTRY } } = process;

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
        const { value, expiresAt } = req.app.locals.token || {};

        const now = new Date();

        let balanceValidationFailed = false;

        const httpsAgent = new https.Agent({ rejectUnauthorized: false });

        if (!value || expiresAt < now) {
          try {
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
              .then((response: any) => {
                console.log('Token obtained.');
                if (response.headers.authorization) return response.headers.authorization.substring(7);
                return null;
              })
              .catch((error: any) => {
                console.log('Error getting token:', error);
                return null;
              });
            if (!token) balanceValidationFailed = true;
            else {
              req.app.locals.token = {
                value: token,
                expiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 23),
              };
            }
          } catch (tokenError) {
            console.error('Error getting token:', tokenError);
            balanceValidationFailed = true;
          }
        }

        let accountBalance = 0.0;
  
        if (!balanceValidationFailed) {
          let phone: string | null = null;
          for (const argument of decoded.inArguments) {
            if (argument.phone) {
              phone = argument.phone;
              break;
            }
          }
          if (!phone) return res.status(400).send('Input parameter is missing.');
  
          try {
            console.log('Getting balance data...');
            const saldoBalancesApiResponse = await axios({
              method: 'post',
              url: API_URL,
              headers: {
                Authorization: `Bearer ${req.app.locals.token.value}`,
                Country: API_COUNTRY,
                'Session-Id': API_SESSION_ID
              },
              httpsAgent,
            });
            if (!saldoBalancesApiResponse || !saldoBalancesApiResponse.data.balancesDetails) balanceValidationFailed = true;
            else accountBalance = saldoBalancesApiResponse.data.balancesDetails.accountBalance;
          } catch (balanceError) {
            console.error('Error getting balance:', balanceError);
            balanceValidationFailed = true;
          }
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

const edit = (req: Request, res: Response) => {
  saveData(req);
  res.send(200, 'Edit');
};

const save = (req: Request, res: Response) => {
  saveData(req);
  res.send(200, 'Save');
};

const publish = (req: Request, res: Response) => {
  saveData(req);
  res.send(200, 'Publish');
};

const validate = (req: Request, res: Response) => {
  saveData(req);
  res.send(200, 'Validate');
};

const stop = (req: Request, res: Response) => {
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
