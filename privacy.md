---
layout: page
title: Privacy
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

<div id="matomo-opt-out" ></div>
<script>
    var settings = {"showIntro":true,"divId":"matomo-opt-out","useSecureCookies":true,"cookiePath":null,"cookieDomain":null,"cookieSameSite":"Lax","OptOutComplete":"Opt-out complete; your visits to this website will not be recorded by the Web Analytics tool.","OptOutCompleteBis":"Note that if you clear your cookies, delete the opt-out cookie, or if you change computers or Web browsers, you will need to perform the opt-out procedure again.","YouMayOptOut2":"You may choose to prevent this website from aggregating and analyzing the actions you take here.","YouMayOptOut3":"Doing so will protect your privacy, but will also prevent the owner from learning from your actions and creating a better experience for you and other users.","OptOutErrorNoCookies":"The tracking opt-out feature requires cookies to be enabled.","OptOutErrorNotHttps":"The tracking opt-out feature may not work because this site was not loaded over HTTPS. Please reload the page to check if your opt out status changed.","YouAreNotOptedOut":"You are not opted out.","UncheckToOptOut":"Uncheck this box to opt-out.","YouAreOptedOut":"You are currently opted out.","CheckToOptIn":"Check this box to opt-in."};
    document.addEventListener('DOMContentLoaded', function() {
        window.MatomoConsent.init(settings.useSecureCookies, settings.cookiePath, settings.cookieDomain, settings.cookieSameSite);
        showContent(window.MatomoConsent.hasConsent());
    });


        function showContent(consent, errorMessage = null, useTracker = false) {

            var errorBlock = '<p style="color: red; font-weight: bold;">';

            var div = document.getElementById(settings.divId);
            if (!div) {
                const warningDiv = document.createElement("div");
                var msg = 'Unable to find opt-out content div: "'+settings.divId+'"';
                warningDiv.id = settings.divId+'-warning';
                warningDiv.innerHTML = errorBlock+msg+'</p>';
                document.body.insertBefore(warningDiv, document.body.firstChild);
                console.log(msg);
                return;
            }

            if (!navigator || !navigator.cookieEnabled) {
                div.innerHTML = errorBlock+settings.OptOutErrorNoCookies+'</p>';
                return;
            }
            if (location.protocol !== 'https:') {
                div.innerHTML = errorBlock+settings.OptOutErrorNotHttps+'</p>';
                return;
            }
            if (errorMessage !== null) {
                div.innerHTML = errorBlock+errorMessage+'</p>';
                return;
            }
            var content = '';
            if (consent) {
                if (settings.showIntro) {
                    content += '<p>'+settings.YouMayOptOut2+' '+settings.YouMayOptOut3+'</p>';
                }
                if (useTracker) {
                    content += '<input onclick="_paq.push([\'optUserOut\']);showContent(false, null, true);" id="trackVisits" type="checkbox" checked="checked" />';
                } else {
                    content += '<input onclick="window.MatomoConsent.consentRevoked();showContent(false);" id="trackVisits" type="checkbox" checked="checked" />';
                }
                content += '<label for="trackVisits"><strong><span>'+settings.YouAreNotOptedOut+' '+settings.UncheckToOptOut+'</span></strong></label>';
            } else {
                if (settings.showIntro) {
                    content += '<p>'+settings.OptOutComplete+' '+settings.OptOutCompleteBis+'</p>';
                }
                if (useTracker) {
                    content += '<input onclick="_paq.push([\'forgetUserOptOut\']);showContent(true, null, true);" id="trackVisits" type="checkbox" />';
                } else {
                    content += '<input onclick="window.MatomoConsent.consentGiven();showContent(true);" id="trackVisits" type="checkbox" />';
                }
                content += '<label for="trackVisits"><strong><span>'+settings.YouAreOptedOut+' '+settings.CheckToOptIn+'</span></strong></label>';
            }
            div.innerHTML = content;
        };

        window.MatomoConsent = {
            cookiesDisabled: (!navigator || !navigator.cookieEnabled),
            CONSENT_COOKIE_NAME: 'mtm_consent', CONSENT_REMOVED_COOKIE_NAME: 'mtm_consent_removed',
            cookieIsSecure: false, useSecureCookies: true, cookiePath: '', cookieDomain: '', cookieSameSite: 'Lax',
            init: function(useSecureCookies, cookiePath, cookieDomain, cookieSameSite) {
                this.useSecureCookies = useSecureCookies; this.cookiePath = cookiePath;
                this.cookieDomain = cookieDomain; this.cookieSameSite = cookieSameSite;
                if(useSecureCookies && location.protocol !== 'https:') {
                    console.log('Error with setting useSecureCookies: You cannot use this option on http.');
                } else {
                    this.cookieIsSecure = useSecureCookies;
                }
            },
            hasConsent: function() {
                var value = this.getCookie(this.CONSENT_COOKIE_NAME);
                if (this.getCookie(this.CONSENT_REMOVED_COOKIE_NAME) && value) {
                    this.setCookie(this.CONSENT_COOKIE_NAME, '', -129600000);
                    return false;
                }
                return (value || value !== 0);
            },
            consentGiven: function() {
                this.setCookie(this.CONSENT_REMOVED_COOKIE_NAME, '', -129600000);
                this.setCookie(this.CONSENT_COOKIE_NAME, new Date().getTime(), 946080000000);
            },
            consentRevoked: function() {
                this.setCookie(this.CONSENT_COOKIE_NAME, '', -129600000);
                this.setCookie(this.CONSENT_REMOVED_COOKIE_NAME, new Date().getTime(), 946080000000);
            },
            getCookie: function(cookieName) {
                var cookiePattern = new RegExp('(^|;)[ ]*' + cookieName + '=([^;]*)'), cookieMatch = cookiePattern.exec(document.cookie);
                return cookieMatch ? window.decodeURIComponent(cookieMatch[2]) : 0;
            },
            setCookie: function(cookieName, value, msToExpire) {
                var expiryDate = new Date();
                expiryDate.setTime((new Date().getTime()) + msToExpire);
                document.cookie = cookieName + '=' + window.encodeURIComponent(value) +
                    (msToExpire ? ';expires=' + expiryDate.toGMTString() : '') +
                    ';path=' + (this.cookiePath || '/') +
                    (this.cookieDomain ? ';domain=' + this.cookieDomain : '') +
                    (this.cookieIsSecure ? ';secure' : '') +
                    ';SameSite=' + this.cookieSameSite;
                if ((!msToExpire || msToExpire >= 0) && this.getCookie(cookieName) !== String(value)) {
                    console.log('There was an error setting cookie `' + cookieName + '`. Please check domain and path.');
                }
            }
        };
</script>

