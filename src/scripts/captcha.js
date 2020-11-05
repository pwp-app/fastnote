function fetchCaptcha() {
  return new Promise((resolve) => {
    $.ajax({
      url: `${cloud_apibase}/common/captcha`,
      type: 'GET',
      success: (res) => {
        if (res && res.data) {
          return resolve(res.data);
        }
        resolve(null);
      },
      error: (err) => {
        console.error('[Cloud] Fetch captcha error.', err);
        resolve(null);
      }
    });
  });
}