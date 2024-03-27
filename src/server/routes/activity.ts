import { Request, Response } from "express";
import { performance } from "perf_hooks";
import https from 'https';
import axios from 'axios';

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
  pack: {
    packId: string;
    description: string;
  }[];
}

interface CaResponse {
  puedeComprar: boolean,
  mensajeTraducido: string,
  error: boolean,
  packIncentivado: string,
  precioPackIncentivado: number,
}

// We use this function to output number properties as float numbers even if they're actually integers.
function formatResponse({
  puedeComprar,
  mensajeTraducido,
  error,
  packIncentivado,
  precioPackIncentivado,
}: CaResponse): string {
  return `{"puedeComprar":${puedeComprar ? 'true' : 'false'},"mensajeTraducido":"${mensajeTraducido}","error":${error ? 'true' : 'false'},"packIncentivado":"${packIncentivado}","precioPackIncentivado":${precioPackIncentivado.toFixed(2)}}`;
}

const execute = async function (req: Request, res: Response) {
  const { body } = req;

  body.toString('utf8'),
    { algorithms: ['HS256'], complete: false },
    async (err: any, decoded?: DecodedBody) => {
      if (err) {
        console.error(err);
        return res.status(401).end();
      }
      res.setHeader('Content-Type', 'application/json');
      res.status(200);
      if (decoded && decoded.inArguments && decoded.inArguments.length > 0) {

        const response: CaResponse = {
          puedeComprar: false,
          mensajeTraducido: '',
          error: true,
          packIncentivado: '',
          precioPackIncentivado: 0.00,
        };

        let cellularNumber: string | null = null;
        let dataExtension: string | null = null;
        let channel: string | null = null;
        for (const argument of decoded.inArguments) {
          if (argument.dataExtension) dataExtension = argument.dataExtension;
          else if (argument.cellularNumber) cellularNumber = argument.cellularNumber;
          else if (argument.channel) channel = argument.channel;
          if (cellularNumber && dataExtension && channel) break;
        }

        const inputData: RequestBody = {
          cellularNumber: Number(cellularNumber),
          channel: channel!
        };

        const {
          API_URL,
          API_SESSION_ID,
          API_COUNTRY
        } = process.env;

        const offersRequestDurationTimestamps: DurationTimestampsPair = { start: performance.now(), end: null };
        let packsValidationFailed = false;

        const packRenovableApiResponse: { data: ResponseBody } | null = await axios({
          method: 'post',
          url: API_URL!,
          data: inputData,
          headers: {
            Country: API_COUNTRY!,
            'Session-Id': API_SESSION_ID!,
          },
          httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        })
          .catch((err) => {
            offersRequestDurationTimestamps.end = performance.now();
            if (err.response) {
              const { data, status } = err.response;
              specialConsoleLog({
                phoneNumber: cellularNumber!,
                eventName: 'OFFERS_REQUEST_FAILED',
                durationTimestamps: offersRequestDurationTimestamps,
                data: { data, status },
              });
            }
            console.log('Error when calling the offers API:');
            console.log(err);
            return null;
          });
        offersRequestDurationTimestamps.end = performance.now();

        specialConsoleLog({
          phoneNumber: cellularNumber!,
          eventName: 'OFFERS_REQUEST_SUCCEDED',
          durationTimestamps: offersRequestDurationTimestamps,
          data: inputData,
        });

        let messageToSend = '';
        let packPrice: number = 0.00;


        return res.send(
          formatResponse({
            ...response,
            mensajeTraducido: messageToSend,
            error: packsValidationFailed ? true : false,
            precioPackIncentivado: packPrice,
          }),
        );
      } else {
        console.error('inArguments invalid.');
        return res.status(400).end();
      }
    };
};

const edit = (req: any, res: any) => {
  logData(req);
  res.status(200).send('Edit');
};

const save = (req: any, res: any) => {
  logData(req);
  res.status(200).send('Save');
};

const publish = (req: any, res: any) => {
  logData(req);
  res.status(200).send('Publish');
};

const validate = (req: any, res: any) => {
  logData(req);
  res.status(200).send('Validate');
};

const stop = (req: any, res: any) => {
  logData(req);
  res.status(200).send('Stop');
};

function millisToMinutesAndSeconds(millis: number): string {
  const minutes = Math.floor(millis / 60000);
  const seconds = ((millis % 60000) / 1000).toFixed(0);
  return Number(seconds) == 60 ? minutes + 1 + 'm' : minutes + 'm ' + (Number(seconds) < 10 ? '0' : '') + seconds + 's';
}

export function specialConsoleLog({
  phoneNumber,
  eventName,
  durationTimestamps,
  data,
}: {
  phoneNumber: string,
  eventName: string,
  durationTimestamps: DurationTimestampsPair,
  data: any,
}): void {
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
