import { Resend } from 'resend';

// Read-only: this command never sends an email or changes domain configuration.
async function checkSetup() {
  if (!process.env.RESEND_API_KEY) {
    console.error('Set RESEND_API_KEY in the private environment.');
    process.exitCode = 1;
    return;
  }

  const from = process.env.RESEND_FROM?.trim();
  const address = from?.match(/<([^<>]+)>$/)?.[1] ?? from;
  const domainName = address?.split('@')[1]?.toLowerCase();
  if (!domainName || /[\r\n]/.test(from) || domainName === 'resend.dev') {
    console.error('Set RESEND_FROM to an address on your verified production domain.');
    process.exitCode = 1;
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  let after;
  let domain;
  do {
    const { data, error } = await resend.domains.list(
      after ? { after } : undefined,
      { signal: AbortSignal.timeout(15000) },
    );
    if (error) {
      console.error(`Cannot check domains: ${error.name}: ${error.message}`);
      process.exitCode = 1;
      return;
    }
    domain = data.data.find((entry) => entry.name.toLowerCase() === domainName);
    after = data.has_more ? data.data.at(-1)?.id : undefined;
  } while (!domain && after);

  if (!domain) {
    console.error(`Add and verify ${domainName} at https://resend.com/domains.`);
    process.exitCode = 1;
    return;
  }

  const { data, error } = await resend.domains.get(domain.id, {
    signal: AbortSignal.timeout(15000),
  });
  if (error) {
    console.error(`Cannot check domain records: ${error.name}: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  console.log(`API key authenticated. Sender: ${from}`);
  console.log(`Domain status: ${data.status}`);
  const sendingRecords = data.records.filter((record) => ['DKIM', 'SPF'].includes(record.record));
  const ready = sendingRecords.some((record) => record.record === 'DKIM')
    && sendingRecords.some((record) => record.record === 'SPF')
    && sendingRecords.every((record) => record.status === 'verified')
    && data.capabilities?.sending === 'enabled';
  console.log(`Outgoing email DNS: ${ready ? 'ready' : 'requires verification'}`);
  for (const record of data.records) {
    console.log(`${record.record} ${record.type} ${record.name}: ${record.status}`);
  }
  if (!ready) process.exitCode = 1;
}

await checkSetup();
