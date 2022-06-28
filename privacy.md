---
layout: page
title: Privacy
description: "Website Privacy Info"
---

This website uses [Matomo](https://matomo.org/), an open source, privacy-respecting web analytics platform. I use Matomo to analyze how users interact with the website, gauge interest, identify issues, and recognize and stop misuse.

If you wish to opt-out, follow the instructions in the opt-out section of this page.

## What Information is Collected

This website does not collect any personally identifiable information (PII). Matomo processes the following data:

- Anonymized IP addresses (last two bytes stripped)
- Date and time of visit
- Title of the page being visited
- URL of the page being visited
- URL of the page that was viewed prior to the current page
- Screen resolution
- Time in local timezone
- Files that were clicked and downloaded
- Link clicks to an outside domain
- Page generation time
- Approximate geolocation based on the anonymized IP
- Main language of the browser
- User agent of the browser

The data is stored on servers hosted by [Endless Hosting](https://theendlessweb.com/) in the United States.

The data is retained for a maximum of one year. Aggregate metrics (such as number of page views, bounce rate, etc.) may be retained indefinitely.

## Contact

Contact me at [tis_dev@protonmail.com](mailto:tis_dev@protonmail.com).

## Opt-out of website tracking

<script>
    var loaded = false;
    window.addEventListener("message", e => {
        if (e.origin === "https://tis.codes" && e.data === "loaded") {
            loaded = true;
            document.getElementById("optOutFrame").style.display = "";
            document.getElementById("optOutLoading").style.display = "none";
            document.getElementById("optOutError").style.display = "none";
        }
    }, false);
    window.setTimeout(function() {
        if (!loaded) {
            document.getElementById("optOutFrame").style.display = "none";
            document.getElementById("optOutLoading").style.display = "none";
            document.getElementById("optOutError").style.display = "";
        }
    }, 5000);
</script>
<div id="optOutLoading">
    <p>Loading...</p>
</div>
<div id="optOutError" style="display:none">
    <p>The opt-out iframe failed to load. If it was blocked by an ad-blocker, you are not being tracked and do not need to opt-out.</p>
</div>
<iframe id="optOutFrame" onload='javascript:window.parent.postMessage("loaded", "https://tis.codes");' style="width:100%;border:none;overflow:hidden;" src="https://matomo.tis.codes/index.php?module=CoreAdminHome&action=optOut&language=en&backgroundColor=1e1f20&fontColor=ffffff&fontSize=20px&fontFamily=Arial"></iframe>

