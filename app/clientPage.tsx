'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { ChevronsUpDown, Loader, Loader2 } from 'lucide-react';
import pLimit from 'p-limit';

import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@radix-ui/react-collapsible';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useRequest, useUpdateEffect } from 'ahooks';
import { FormEvent, useActionState, useEffect, useRef, useState } from 'react';
import { getLink } from './actions';
import showErrMessage, { getErrMessage } from '@/lib/showErrMessage';
import { toast } from 'sonner';
import { CopyButton } from '@/components/CopyButton';

function processTextareaContent(text?: string): string[] {
  // 使用正则表达式按行分割文本，兼容不同操作系统的换行符
  const lines = text?.split(/\r?\n/);
  // 过滤掉空行
  const nonEmptyLines = lines?.filter((line) => line.trim() !== '');
  // 去重
  const uniqueLines = [...new Set(nonEmptyLines)];
  return uniqueLines;
}

export default function ClientPage() {
  const [result, setResult] = useState<
    Array<{ skuViewId: string; sid: string; 1: string; 3: string }>
  >([]);
  const resultDom = useRef<HTMLDivElement>(null);

  let submitId = useRef(0);
  const { runAsync, loading } = useRequest(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      submitId.current = +new Date();
      const formData = new FormData(event.currentTarget);
      const sidArray = processTextareaContent(formData.get('sids')?.toString());
      const skuViewIdArray = processTextareaContent(
        formData.get('skuViewIds')?.toString()
      );
      formData.delete('sids');
      formData.delete('skuViewIds');

      const rawFormData = {
        ...(Object.fromEntries(formData) as {
          appSecret: string;
          appKey: string;
        }),
        sidArray,
        skuViewIdArray,
      };

      if (!skuViewIdArray) throw new Error('请填写商品SkuViewId');

      resultDom.current?.scrollIntoView();

      const list = skuViewIdArray.reduce((prev, cur, index) => {
        prev.push(
          ...(sidArray.length ? sidArray : ['']).map((item) => {
            return {
              sid: item,
              skuViewId: cur,
              1: '',
              3: '',
            };
          })
        );

        return prev;
      }, [] as typeof result);
      setResult(list);

      // STEP: 进行请求
      const limit = pLimit(3);
      const curSubmitId = submitId.current;
      const requests = list.map((item, i) =>
        limit(async () => {
          if (submitId.current !== curSubmitId) return;

          const idx = list.findIndex(
            (n) => n.sid === item.sid && n.skuViewId === item.skuViewId
          );

          try {
            const res = await getLink({ ...rawFormData, ...item });
            setResult((prev) =>
              prev.map((n, index) =>
                index === idx ? { ...n, ...res.data } : n
              )
            );
          } catch (err) {
            const errorMsg = getErrMessage(err);
            setResult((prev) =>
              prev.map((n, index) =>
                index === idx
                  ? { ...n, 1: `ERROR:${errorMsg}`, 3: `ERROR:${errorMsg}` }
                  : n
              )
            );
            throw new Error(errorMsg);
          }
        })
      );

      await Promise.all(requests);
    },
    {
      manual: true,
      onError: showErrMessage,
      onSuccess: () => toast.success('取链成功'),
    }
  );

  return (
    <div className='p-4'>
      <form onSubmit={runAsync}>
        <div className=' flex flex-col md:flex-row'>
          <Collapsible
            defaultOpen
            className='w-1/2 md:min-w-[680px] md:shrink-0'
          >
            <Card className=''>
              <CardHeader>
                <CardTitle className='flex items-center justify-between '>
                  <i className='w-6 h-6 rounded-full bg-yellow-400 text-center leading-6 mr-2'>
                    1
                  </i>
                  媒体信息
                  <span className='flex-grow' />
                  <CollapsibleTrigger className='text-gray-400 hover:text-gray-800 '>
                    {/* <Button variant='ghost' size='sm'> */}
                    <ChevronsUpDown className='h-4 w-4' />
                    <span className='sr-only'>Toggle</span>
                    {/* </Button> */}
                  </CollapsibleTrigger>
                </CardTitle>
                <CardDescription className='flex items-center pl-8'>
                  在美团联盟后台-
                  <a
                    href='https://media.meituan.com/pc/index.html#/spread/bit'
                    target='_blank'
                    className='text-indigo-500'
                  >
                    媒体管理
                  </a>
                  中获取信息
                  <Separator
                    orientation='vertical'
                    className='h-4 shrink-0 mx-2'
                  />
                  <a
                    href='https://kq-material.cpshelp.cn/v2/mass-push/image/20250221/c2c28120310a34cf3a45e9f6aac1a082.png'
                    target='_blank'
                    className='text-indigo-500'
                    referrerPolicy='no-referrer'
                  >
                    教程
                  </a>
                </CardDescription>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className='pl-14'>
                  <div className='grid grid-cols-2 gap-6'>
                    <div className=''>
                      <Label htmlFor='appKey'>AppKey</Label>
                      <Input
                        required
                        id='appKey'
                        name='appKey'
                        placeholder='请输入appkey'
                        className='mt-1.5'
                      />
                    </div>
                    <div>
                      <Label htmlFor='appSecret'>AppSecret</Label>
                      <Input
                        id='appSecret'
                        className='mt-1.5'
                        name='appSecret'
                        required
                        placeholder='请输入签名密钥 AppSecret'
                      />
                    </div>
                  </div>
                  <div className='grid grid-cols-2 gap-6 mt-4'>
                    <div className=''>
                      <Label htmlFor='sids'>SID</Label>
                      <Textarea
                        id='sids'
                        name='sids'
                        placeholder='请输入推广位SID'
                        className='mt-1.5'
                      />
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
              {/* <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Deploy</Button>
      </CardFooter> */}
            </Card>
          </Collapsible>

          <Collapsible
            defaultOpen
            // className='mt-6'
            className='md:ml-6 md:mt-0 mt-6 w-1/2'
          >
            <Card className=''>
              <CardHeader>
                <CardTitle className='flex items-center justify-between '>
                  <i className='w-6 h-6 rounded-full bg-yellow-400 text-center leading-6 mr-2'>
                    2
                  </i>
                  商品信息
                  <span className='flex-grow' />
                  <CollapsibleTrigger className='text-gray-400 hover:text-gray-800 '>
                    <ChevronsUpDown className='h-4 w-4' />
                    <span className='sr-only'>Toggle</span>
                  </CollapsibleTrigger>
                </CardTitle>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className='pl-14'>
                  <div className='pb-2.5'>
                    <Label htmlFor='skuViewIds'>商品SkuViewId</Label>
                    <Textarea
                      placeholder='输入商品ID(skuViewId)'
                      //  rows={20}
                      rows={4}
                      required
                      className='mt-1.5'
                      name='skuViewIds'
                      id='skuViewIds'
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
              <CardFooter className='flex justify-end'>
                <Button
                  variant='outline'
                  className='mr-4'
                  type='reset'
                  onClick={() => {
                    setResult([]);
                  }}
                >
                  清空
                </Button>
                <Button disabled={loading} type='submit'>
                  {loading && <Loader2 className='animate-spin' />}提交取链
                </Button>
              </CardFooter>
            </Card>
          </Collapsible>
        </div>
      </form>

      <Collapsible defaultOpen className='mt-6' ref={resultDom}>
        <Card className=''>
          <CardHeader>
            <CardTitle className='flex items-center justify-between '>
              <i className='w-6 h-6 rounded-full bg-yellow-400 text-center leading-6 mr-2'>
                3
              </i>
              取链结果
              <span className='flex-grow' />
              <CollapsibleTrigger className='text-gray-400 hover:text-gray-800 '>
                <ChevronsUpDown className='h-4 w-4' />
                <span className='sr-only'>Toggle</span>
              </CollapsibleTrigger>
            </CardTitle>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className='pl-12'>
              <Table>
                {/* <TableCaption>A list of your recent invoices.</TableCaption> */}
                <TableHeader>
                  <TableRow>
                    {result.find((i) => i.sid) && <TableHead>SID</TableHead>}
                    <TableHead>商品SkuViewId</TableHead>
                    <TableHead>deeplink(唤起)链接</TableHead>
                    <TableHead>H5长链接</TableHead>
                    {/* <TableHead className='text-right'>Amount</TableHead> */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.map((item) => (
                    <TableRow key={`${item.skuViewId}-${item.sid}`}>
                      {result.find((i) => i.sid) && (
                        <TableCell>{item.sid}</TableCell>
                      )}
                      <TableCell>{item.skuViewId}</TableCell>
                      <TableCell className=' break-all group'>
                        {!item[3] && (
                          <span className='flex items-center text-gray-400'>
                            <Loader className='animate-spin w-3 mr-1.5 -my-0.5' />
                            获取中
                          </span>
                        )}
                        {item[3]}
                        {item[3] && (
                          <CopyButton
                            value={item[3]}
                            className='ml-1 group-hover:opacity-100 opacity-0 group-hover:transition-all'
                          />
                        )}
                      </TableCell>
                      <TableCell className='group'>
                        {!item[1] && (
                          <span className='flex items-center text-gray-400'>
                            <Loader className='animate-spin w-3 mr-1.5 -my-0.5' />
                            获取中
                          </span>
                        )}
                        {item[1]}
                        {item[1] && (
                          <CopyButton
                            value={item[1]}
                            className='ml-1 group-hover:opacity-100 opacity-0 group-hover:transition-all'
                          />
                        )}
                      </TableCell>
                      {/* <TableCell className='text-right'>
                        {invoice.totalAmount}
                      </TableCell> */}
                    </TableRow>
                  ))}
                </TableBody>
                {/* <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3}>Total</TableCell>
                    <TableCell className='text-right'>$2,500.00</TableCell>
                  </TableRow>
                </TableFooter> */}
              </Table>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
