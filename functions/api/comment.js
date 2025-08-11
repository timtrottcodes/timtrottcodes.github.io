export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const formData = await context.request.formData();
    const turnstileToken = formData.get("cf-turnstile-response");

    // Validate Turnstile
    const ip = context.request.headers.get("CF-Connecting-IP");
    const turnstileSecret = "0x4AAAAAABhnbf3Us1tKQqg9qd7mPpDMbhY";
    const turnstileVerify = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: turnstileSecret,
          response: turnstileToken,
          remoteip: ip,
        }),
      }
    );

    const captchaResult = await turnstileVerify.json();
    if (!captchaResult.success) {
      return new Response("CAPTCHA failed", { status: 400 });
    }

    const data = {
      name: formData.get("name")?.trim(),
      email: formData.get("email")?.trim(),
      website: formData.get("website")?.trim(),
      comment: formData.get("comments")?.trim(),
      pageId: formData.get("pageId")?.trim(),
      siteId: formData.get("siteId")?.trim(),
      replyto: formData.get("replyto")?.trim(),
      datetime: new Date().toISOString().replace("T", " ").substring(0, 19),
    };

    const timestamp = Date.now();
    const key = `comment-${timestamp}`;
    const value = JSON.stringify(data);
    await env.COMMENTS.put(key, value);

    return new Response("Comment submitted successfully.", { status: 200 });
  } catch (err) {
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
}
