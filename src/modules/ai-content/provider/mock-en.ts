import type { FactsSheet } from '@/modules/ai-content/facts';

/**
 * The mock provider's English fixtures (ADR-043): the same shape as the Arabic ones, built
 * from the topic and the facts sheet, long enough for the default length rule and with two
 * internal links under `/en/`. Deterministic per topic.
 */
export interface MockOutline {
  headings: Array<{ question: string; answer: string }>;
  takeaways: string[];
  imageKeyword: string;
}

function seed(text: string): number {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.codePointAt(0)!) % 1_000_003;
  return h;
}

export function outlineForEn(topic: string, keyword: string, hub: string): MockOutline {
  return {
    headings: [
      {
        question: `What does ${keyword} mean?`,
        answer: `${keyword} is a way to sell printed products with no stock.`,
      },
      {
        question: 'How do you start within a week?',
        answer: 'One design, a store and a free account are enough to start.',
      },
      {
        question: 'How much do you earn per piece?',
        answer: 'The difference between the selling price and the base cost is your profit.',
      },
      {
        question: 'Which mistakes slow the start down?',
        answer: 'Waiting for the perfect design and pricing a piece without the numbers.',
      },
      {
        question: 'What do you do after the first order?',
        answer: 'Watch what sold and extend the winning design to a second product.',
      },
    ],
    takeaways: [
      `${keyword}: you sell first and the piece is printed after, so you pay only for what sold.`,
      `The ${hub} hub starts from one design and a store on Salla, Zid or Shopify.`,
      'Your profit is the difference between the selling price and the base cost before shipping and tax.',
    ],
    imageKeyword: seed(topic) % 2 === 0 ? 'printed t-shirt studio' : 'small business owner laptop',
  };
}

const para = (...sentences: string[]) => sentences.join(' ');

export function draftForEn(topic: string, keyword: string, hub: string, facts: FactsSheet): string {
  const outline = outlineForEn(topic, keyword, hub);
  // The sheet the provider was built with may be the Arabic one: read the numbers by unit and
  // position (`factsSheet` lists the credit, then per product cost, price, profit), not by label.
  const sars = facts.numbers.filter((n) => n.unit === 'sar').map((n) => n.value);
  const credit = sars[0] ?? 30;
  const cost = sars[1] ?? 45;
  const price = sars[2] ?? 89;
  const profit = price - cost;
  const days = facts.numbers.find((n) => n.unit === 'days')?.value ?? 5;
  const count = facts.numbers.find((n) => n.unit === 'count')?.value ?? 5;
  const product = '/en/products/tee-essential';
  const variant = seed(topic) % 3;
  const openers = [
    `${topic}: a question that reaches us every week from merchants who want to start with no factory and no stock.`,
    `Many merchants put off ${keyword} because they believe the start needs a large capital, and the reality is simpler.`,
    `This guide explains ${keyword} with the real numbers merchants in Saudi Arabia work with today.`,
  ];
  const sections = outline.headings.map((h, i) => {
    const body: string[] = [`## ${h.question}`, h.answer];
    switch (i) {
      case 0:
        body.push(
          para(
            'The right start understands the model before the store opens, because every decision after that, from the design to the price, is built on it.',
            'With traditional printing you pay up front for a whole batch and then try to sell it; with print on demand no piece is printed until your customer buys it.',
            `The order reaches B7R Print automatically from your store, the piece is printed in Jeddah and shipped under your store's name within ${days} days at most.`,
            'There is no minimum order and no leftover pieces at the end of the season, which is what makes the model right for a small start.',
          ),
          para(
            `The account is free, and you receive SAR ${credit} of welcome credit at sign-up to try your first product with.`,
            `The catalogue holds ${count} products with one front print area, so you focus on the design rather than the logistics.`,
            'What changes is the way you think: instead of asking how many pieces to buy, you ask which design sells, and you leave the printing and the shipping to people who do it every day.',
          ),
          para(
            'A merchant who starts this way loses less when they get it wrong, because they never paid for stock that did not sell, and earns faster when they get it right, because growing takes nothing but a new design.',
            'That is what makes the model fit a designer at the start of the road and a store owner who wants a new line without risk.',
          ),
        );
        break;
      case 1:
        body.push(
          para(
            'The first step is a brand name that is easy to say and to write, the second is one design at a quality fit for printing, and the third is an online store.',
            'If your store is on Salla, Zid or Shopify the connection takes minutes, and after it you publish the product and start selling the same day.',
          ),
          '- Choose one design and test it before you design a whole collection.',
          '- Set the selling price with the profit calculator before you publish the product.',
          '- Read [how the service works](/en/how-it-works) once, then start.',
          para(
            'Do not wait for the perfect design; the brands that succeed start from a single piece and adjust after the first ten orders.',
            'Make the product page clear: a real photo of the piece, the sizes and the delivery time.',
            'Say in the description who the design is for and why, in two sentences, because the customer buys the story before the fabric.',
          ),
          para(
            'On the first day publish the product and share it with ten people you know, then read their questions before you read their sales.',
            'Repeated questions tell you what the product page is missing; silence tells you the design has not touched anyone yet.',
            'After a week you have real data instead of guesses, and that is worth more than any marketing course.',
          ),
        );
        break;
      case 2:
        body.push(
          para(
            `An example from the catalogue: [the essential T-shirt](${product}) costs SAR ${cost} and the suggested selling price is SAR ${price}.`,
            `The difference of SAR ${profit} is your estimated profit per piece before shipping and tax; the cost is deducted from your wallet and the profit added to it with every order.`,
            'Raise the margin when your design is distinctive or your audience is loyal, and lower it when you test a new market.',
          ),
          para(
            'Write the three numbers down before you publish: the cost, the selling price and the profit per piece.',
            'A merchant who knows the numbers is not afraid of seasonal discounts, because they know where the margin stands.',
            'Nor are they afraid of a competitor selling for less, because a price below cost never lasts long.',
          ),
          para(
            'Shipping and tax come after this calculation, not before it: shipping within the Kingdom is deducted from the wallet with every order, and tax is calculated according to your store.',
            'If you offer free shipping, build its cost into the price instead of finding at the end of the month that the margin melted.',
            'And if most orders hold one piece, a slightly higher price with shipping included convinces the customer more than a low price with fees added at the last step.',
          ),
        );
        break;
      case 3:
        body.push(
          para(
            'The first mistake is waiting for the perfect design; the second is pricing the piece below the market, believing the price alone sells.',
            'The third is copying protected designs, which can close your store before it starts.',
            'The fourth is neglecting the product page: one weak photo loses more orders than the price does.',
          ),
          para(
            'Read [the frequently asked questions](/en/faq) before you open a support ticket; most of what stops a new merchant is written there.',
            variant === 0
              ? 'And if you have a question with no answer there, WhatsApp is the fastest route.'
              : 'And when you hesitate over a decision, go back to your numbers, not your gut.',
          ),
          para(
            'The fifth mistake is opening five products in one day and spreading your effort across them, so none gets a good photo or a convincing description.',
            'Start with one product and one design, make them worth ordering, then repeat what worked.',
            'Each of these mistakes can be fixed in a week, as long as you read your store numbers every day.',
          ),
        );
        break;
      default:
        body.push(
          para(
            'After the first order watch three things: which design sold, which city the order came from, and how long the customer took before buying.',
            'Extend the winning design to a second product from the same catalogue at no extra cost; the design is the same and only the piece changes.',
            'Test a price for two weeks before you change it, because permanent discounts teach your customer to wait.',
          ),
          para(
            'The rule is the same in every season: start small, measure the results, then expand what works.',
            `That is the heart of ${keyword}, and it is what makes the start possible today rather than in a year.`,
            'Seasons come every year on known dates, so prepare the next season’s designs six weeks ahead and watch which design from the last one still sells.',
          ),
          para(
            'In the end, remember that the successful store is not the one with the most designs but the one that knows its customers best: which city they buy from, which size is ordered most, and when they come back.',
            'That knowledge is built order by order, and it starts with the first piece you publish this week.',
          ),
        );
    }
    return body.join('\n\n');
  });
  return [openers[variant]!, ...sections].join('\n\n');
}

export function seoForEn(
  topic: string,
  keyword: string,
): { title: string; description: string; slug: string; alt: string } {
  return {
    title: topic.length <= 60 ? topic : topic.slice(0, 57).trimEnd(),
    description:
      `A practical guide to ${keyword} in Saudi Arabia with the real numbers: cost, profit and the steps to take.`.slice(
        0,
        155,
      ),
    slug: `${keyword
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 24)}-guide`,
    alt: 'A printed T-shirt with an Arabic design on a work table',
  };
}
