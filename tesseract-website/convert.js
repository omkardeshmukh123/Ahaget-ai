const fs = require('fs');

function convertHtmlToJsx(inputFile, outputFile, componentName) {
  const html = fs.readFileSync(inputFile, 'utf-8');
  
  // Extract body content or main content
  let bodyContent = html.match(/<main[\s\S]*?<\/main>/i);
  if (!bodyContent) bodyContent = html.match(/<body[\s\S]*?>([\s\S]*)<\/body>/i);
  
  let jsx = bodyContent ? bodyContent[0] : html;
  
  // Convert class to className
  jsx = jsx.replace(/class=/g, 'className=');
  
  // Convert for to htmlFor
  jsx = jsx.replace(/for=/g, 'htmlFor=');
  
  // Convert self-closing tags
  jsx = jsx.replace(/<img([^>]*[^/])>/g, '<img$1 />');
  jsx = jsx.replace(/<input([^>]*[^/])>/g, '<input$1 />');
  jsx = jsx.replace(/<br([^>]*[^/])>/g, '<br$1 />');
  jsx = jsx.replace(/<hr([^>]*[^/])>/g, '<hr$1 />');
  
  // Convert style="font-variation-settings: 'FILL' 1;" to style={{ fontVariationSettings: "'FILL' 1" }}
  jsx = jsx.replace(/style="([^"]*)"/g, (match, p1) => {
    const styleObj = p1.split(';').filter(Boolean).reduce((acc, curr) => {
      const [key, value] = curr.split(':').map(s => s.trim());
      if (key && value) {
        const camelKey = key.replace(/-([a-z])/g, g => g[1].toUpperCase());
        acc.push(`${camelKey}: "${value}"`);
      }
      return acc;
    }, []).join(', ');
    return `style={{ ${styleObj} }}`;
  });
  
  // Remove HTML comments
  jsx = jsx.replace(/<!--[\s\S]*?-->/g, '');
  
  const fileContent = `import React from 'react';
import Link from 'next/link';

export default function ${componentName}() {
  return (
    <>
      ${jsx}
    </>
  );
}
`;

  fs.writeFileSync(outputFile, fileContent, 'utf-8');
  console.log(`Converted ${inputFile} to ${outputFile}`);
}

convertHtmlToJsx('stitch_home.html', 'app/page.tsx', 'HomePage');
convertHtmlToJsx('stitch_pricing.html', 'app/pricing/page.tsx', 'PricingPage');
convertHtmlToJsx('stitch_contact.html', 'app/contact/page.tsx', 'ContactPage');
