const render_reg = {
    strong: /(\*\*)(.*)(\*\*)/gi,
    em: /(\*)(.*)(\*)/gi,
    link: /(\[)(.*)(\])(\()(.*)(\))/gi,
    hr: /(\n\s*(-\s*){3,}\s*\n)|(\n\s*(\*\s*){3,}\s*\n)|(\n\s*(_\s*){3,}\s*\n)/gi,
    h1: /#&nbsp;(.+)/gi,
    h2: /##&nbsp;(.+)/gi,
    h3: /###&nbsp;(.+)/gi,
    h4: /####&nbsp;(.+)/gi,
    h5: /#####&nbsp;(.+)/gi,
    url: /(?!(href="))(http|ftp|https|mailto):\/\/([\w\-_]+(\.[\w\-_]+)|(localhost))+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/gi
};

module.exports = render_reg;