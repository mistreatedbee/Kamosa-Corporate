# Kamosa Admin — Operating Guide

One page. Everything you need to run the lead inbox day to day.

---

## Logging in

1. Go to **kamosa-corporate.vercel.app/admin/login**
2. Enter the admin key (given to you separately — treat it like a password; don't share it over
   email or WhatsApp, and don't paste it anywhere public)
3. You'll land on the Enquiries list

Your session stays logged in for 8 hours, then asks you to sign in again. This is normal.

## Check daily, for now

**Until the domain is bought and email notifications are switched on, this page is the only way
you find out someone contacted you.** There is no ping to your phone or inbox yet — a new enquiry
just sits here silently. Make it a habit: check `/admin` once a day, ideally in the morning.

Once email is live, the inbox becomes your backup record rather than your only way of finding out.

## What you're looking at

**The four cards at the top** count every enquiry in the database (all time, not just this page):
Total, New, In progress (Contacted + Qualified + In Progress together) and Converted. Click a card
to filter the list to it. The strip underneath shows how many arrived in the last 7 / 30 days, how
many follow-ups are due, and the count for every individual status. Click any of them to filter.

**Search and filters.** The search box looks through name, email, phone, company and the message.
Underneath you can filter by status, enquiry type, service and the date it was received. All of
these combine (e.g. "new training quote requests received this month"). Active filters appear as
chips; click × on one, or **Clear all**. Filters live in the page address, so they survive a
refresh and you can bookmark or share a filtered view. Sort by newest (default), oldest, recently
updated or follow-up date.

**The list.** On a laptop or desktop it's a table. On a phone or tablet each enquiry is a card.
Click a name or **View** to open the full enquiry. The **⋯** menu on each row lets you email or
call the client, copy their email, or change the status without opening it. Enquiry types and
services are shown in plain English (e.g. `quote_training` is **Training Quote Request**), but the
stored values are never changed.

## The enquiry panel

Opening an enquiry slides out a panel with everything that was submitted: contact details, enquiry
type, service, the **original message exactly as the client typed it**, any extra quote details
(e.g. course and number of learners), and which form it came from. From here you can:

- **Change the status**: pick it, then press **Update status**. You'll get a confirmation, and
  the counts at the top update straight away. If the save fails you'll see an error, and nothing
  will have changed.
- **Edit contact details**: fix a typo in the name, email, phone or company. The original
  message can't be edited.
- **Set follow-ups**: the next follow-up date, and the date you last contacted them. Enquiries
  whose follow-up is today or overdue are flagged in the list and counted in **Follow-ups due**.
  Converted, Closed and Spam enquiries are never flagged.
- **Add internal notes**: use the quick buttons ("Client contacted", "Quote being prepared", …) or
  type your own.

Every status change and follow-up change is also recorded automatically in the notes history, so
you can always see how an enquiry got to where it is (e.g. when it became Converted).

**Notes are internal.** They're only visible here, never shown on the website, and never included
in emails to the client.

Close the panel with **Back to list** (or Esc). Your filters and position are kept.

## Statuses: what to set, and when

- **New**: default. Nothing done yet.
- **Contacted**: you've reached out (phone, email, WhatsApp).
- **Qualified**: it's a real, viable enquiry worth pursuing.
- **In Progress**: you're actively working it (preparing a quote, in discussion).
- **Converted**: became a client / the work happened. Set this yourself only when it's true.
  Nothing marks an enquiry Converted automatically.
- **Closed**: didn't go anywhere, but it was a real enquiry.
- **Spam**: not a real enquiry. (The site already filters obvious bots before they reach this
  list, so anything you see here got past that. Use this status sparingly.)

## Exporting to CSV

**Export CSV** asks whether you want the enquiries matching your current filters (every match,
not just the page you're on) or all enquiries. The file opens cleanly in Excel or Google Sheets,
with readable labels and dates in South African time.

Internal notes and follow-up dates are left **out** unless you tick **Include internal notes and
follow-up dates**. Leave it unticked for any file that will leave the team.

## What NOT to do

- Don't share the admin key with anyone who doesn't need it. If you think someone who shouldn't
  have it has seen it, ask for it to be rotated.
- Don't rely on this page alone for anything time-sensitive until email notifications are on.
  Check it daily in the meantime.
- Don't expect to delete enquiries. That's deliberate: every lead stays on record. Use **Closed**
  or **Spam** instead.
