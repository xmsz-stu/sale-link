/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

// const APP_KEY = '86a9aa10071e44e89907d6cec2b4ead4';
// const APP_SECRET = 'eb8b57490b7d4b119973480665f6c665';

// const APP_KEY = '11097aa9d4464243bab531cf20ca91e2';
// const APP_SECRET = '78759db37e304680b04444b6f7144049';

import crypto from 'crypto';
import axios, { AxiosRequestConfig } from 'axios';
import { getErrMessage } from '@/lib/showErrMessage';

class Meituan {
  APP_KEY: string;
  APP_SECRET: string;

  constructor(appKey: string, appSecret: string) {
    this.APP_KEY = appKey;
    this.APP_SECRET = appSecret;
  }

  /**
   * 获取签名头部字段
   */
  getSignHeaders(config: AxiosRequestConfig<any>) {
    const milliseconds = Date.now().toString();
    const contentMD5 = this.contentMD5(config);
    const signHeaders = `S-Ca-App:${this.APP_KEY}\nS-Ca-Timestamp:${milliseconds}\n`;

    return {
      'Content-Type': 'application/json',
      'S-Ca-App': this.APP_KEY,
      'S-Ca-Timestamp': milliseconds,
      'S-Ca-Signature-Headers': 'S-Ca-Timestamp,S-Ca-App',
      'Content-MD5': contentMD5,
      'S-Ca-Signature': this.sign(config, signHeaders),
    };
  }

  sign(config: AxiosRequestConfig<any>, signHeaders: string) {
    const httpMethod = config.method!.toUpperCase();
    const contentMD5 = this.contentMD5(config);
    const url = this.url(config);
    const stringToSign = `${httpMethod}\n${contentMD5}\n${signHeaders}${url}`;
    return crypto
      .createHmac('sha256', this.APP_SECRET)
      .update(stringToSign)
      .digest('base64');
  }

  contentMD5(config: AxiosRequestConfig<any>) {
    if (
      config.method &&
      config.method.toLowerCase() === 'post' &&
      config.data
    ) {
      const jsonString = JSON.stringify(config.data);
      const md5Hash = crypto.createHash('md5').update(jsonString).digest();
      return md5Hash.toString('base64');
    } else {
      return '';
    }
  }

  url(config: AxiosRequestConfig<any>) {
    const url = config.url;
    // 提取URL路径部分
    const path = '/' + url!.split('/').slice(3).join('/');
    if (
      config.method &&
      config.method.toLowerCase() === 'get' &&
      config.params
    ) {
      const queryParams = new URLSearchParams(config.params).toString();
      return queryParams ? `${path}?${queryParams}` : path;
    } else {
      return path;
    }
  }

  async sendRequest(config: AxiosRequestConfig<any>) {
    const headers = this.getSignHeaders(config);

    try {
      const res = await axios<{ code: number; data: string; message: string }>({
        method: config.method,
        url: config.url,
        data: config.data,
        params: config.params,
        headers: headers,
      });

      if (res.data.code !== 0) {
        throw new Error(res.data.message);
      }

      return res.data;
    } catch (err) {
      throw new Error(getErrMessage(err));
    }
  }
}

// const requestConfig = {
//   method: 'POST',
//   url: 'https://media.meituan.com/cps_open/common/api/v1/query_coupon',
//   data: {
//     // latitude: 39928000,
//     // longitude: 116404000,
//     // priceFloor: 0,
//     // priceCap: 5000,
//     // vpSkuViewIds: ['MU5JVZT7XTGJ3UCOARWKXXXXXX', 'MCVKOBE3ASOKPPPKLMREXXXXXX'],
//     // pageNo: 1,
//     // pageSize: 3,
//     // ascDescOrder: 2,
//     // sortField: 1,
//     searchText: '奶茶',
//   },
// };

export async function getLink({
  appKey,
  appSecret,
  sid,
  skuViewId,
}: {
  appKey: string;
  appSecret: string;
  sid: string;
  skuViewId: string;
}) {
  const meituan = new Meituan(appKey, appSecret);
  const data = {
    1: '',
    3: '',
  };
  await Promise.all(
    [1, 3].map(async (item) => {
      return (async () => {
        const res = await meituan.sendRequest({
          method: 'POST',
          url: 'https://media.meituan.com/cps_open/common/api/v1/get_referral_link',
          data: {
            linkType: item, // 3 dp 1 h5
            sid,
            skuViewId,
            platform: 2,
            // bizLine: 5,
          },
        });
        data[item as 1 | 3] = res.data;
      })();
    })
  );

  return {
    data,
  };
}
