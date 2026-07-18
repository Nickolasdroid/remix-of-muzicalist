UPDATE public.email_template_versions
SET html_content = replace(
  html_content,
  '<tr><td align="center" style="padding:36px 32px 8px 32px;">
        <div style="font-family:Georgia,''Times New Roman'',serif;font-size:24px;letter-spacing:6px;color:#d4af37;font-weight:700;">MUZICALIST</div>
      </td></tr>',
  '<tr><td align="center" style="padding:36px 32px 8px 32px;">
        <img src="https://muzicalist.com/__l5e/assets-v1/4023aaf1-cafa-4e98-b2ad-2daef180891b/muzicalist-logo.png" width="72" height="72" alt="MUZICALIST" style="display:block;margin:0 auto 14px auto;border:0;outline:none;text-decoration:none;height:72px;width:72px;" />
        <div style="font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Helvetica,Arial,sans-serif;font-size:26px;letter-spacing:6px;color:#ffffff;font-weight:800;">MUZICALIST</div>
      </td></tr>'
)
WHERE id = 'a48ea049-e442-49be-9310-fc2913f84715';