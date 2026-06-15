
async function testAuth() {
  console.log("--- 1. Calling NestJS Backend /auth/login ---");
  const loginRes = await fetch("http://localhost:3000/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@rbac-test.local",
      password: "Test@1234"
    })
  });
  console.log("NestJS Login Status:", loginRes.status);
  const loginData: any = await loginRes.json();
  console.log("NestJS Login Response keys:", Object.keys(loginData));
  if (!loginData.access_token) {
    console.error("No access token!");
    return;
  }
  const atlasToken = loginData.access_token;
  console.log("atlas_token exists:", !!atlasToken);

  console.log("\n--- 2. Fetching CSRF Token from Next.js ---");
  const csrfRes = await fetch("http://localhost:3001/api/auth/csrf");
  console.log("CSRF status:", csrfRes.status);
  const csrfData: any = await csrfRes.json();
  console.log("CSRF Data:", csrfData);
  const csrfToken = csrfData.csrfToken;
  const csrfCookie = csrfRes.headers.get("set-cookie");
  console.log("CSRF Set-Cookie header:", csrfCookie);

  console.log("\n--- 3. Calling NextAuth Credentials Callback ---");
  // Form urlencoded payload
  const body = new URLSearchParams();
  body.append("email", "admin@rbac-test.local");
  body.append("password", "Test@1234");
  body.append("csrfToken", csrfToken);
  body.append("callbackUrl", "/fr/dashboard");
  body.append("json", "true"); // standard NextAuth json callback flag

  const authRes = await fetch("http://localhost:3001/api/auth/callback/credentials", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": csrfCookie || "",
    },
    body: body.toString(),
    redirect: "manual" // we want to inspect redirect headers
  });

  console.log("Auth callback status:", authRes.status);
  console.log("Auth callback headers:", [...authRes.headers.entries()]);
  const authCookie = authRes.headers.get("set-cookie");
  console.log("Auth Callback Set-Cookie:", authCookie);
  
  if (authRes.status === 302 || authRes.status === 303 || authRes.status === 200) {
    const redirectUrl = authRes.headers.get("location") || "";
    console.log("Redirect Location:", redirectUrl);
    
    // Let's attempt to access the redirect target with the cookies!
    console.log("\n--- 4. Accessing protected page with returned cookies ---");
    const targetUrl = redirectUrl.startsWith("http") ? redirectUrl : `http://localhost:3001${redirectUrl}`;
    
    // Combine the CSRF cookie and session cookie if present
    const requestCookies = [];
    if (csrfCookie) requestCookies.push(csrfCookie.split(";")[0]);
    
    // Get all cookies returned from callback (including chunked auth cookies)
    const authCookies = (authRes.headers as any).getSetCookie();
    console.log("All auth cookies returned:", authCookies);
    for (const cookieStr of authCookies) {
      requestCookies.push(cookieStr.split(";")[0]);
    }
    requestCookies.push(`atlas_token=${atlasToken}`);
    
    const pageRes = await fetch(targetUrl, {
      headers: {
        "Cookie": requestCookies.join("; ")
      },
      redirect: "manual"
    });
    console.log("Protected Page Status:", pageRes.status);
    console.log("Protected Page Location:", pageRes.headers.get("location"));
    console.log("Protected Page Set-Cookie:", pageRes.headers.get("set-cookie"));
  }

  console.log("\n--- 5. Verifying Register page access ---");
  const regRes = await fetch("http://localhost:3001/fr/register");
  console.log("Register page status:", regRes.status);
}

testAuth().catch(console.error);
