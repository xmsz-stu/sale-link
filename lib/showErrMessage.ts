import { toast } from 'sonner';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getErrMessage(err: any) {
  return err.response?.data?.message || err.message || err.errMsg || err;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default (err: any) => {
  const errMsg = getErrMessage(err);
  toast.warning(errMsg);
  return errMsg;
};
