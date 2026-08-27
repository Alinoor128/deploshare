import { redirect } from 'next/navigation';

export default async function AccessCodeParamPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  redirect(`/access?code=${code}`);
}
