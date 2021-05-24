# TaylorBot.Classic

This repository is an early source code archive of [TaylorBot](https://taylorbot.app/), a multi-purpose Discord bot originally created for the r/TaylorSwift Discord server in **November 2015**. The provided source is roughly equivalent to the version used up until **September 2017**, with minor tweaks.

The code is poorly written and it quickly became clear that it was **not realistically maintainable**. In September 2017, I started completely rewriting it with much better coding practices. Components and commands were progressively migrated to the rewritten version, during which both versions existed simultaneously. On January 21, 2019, all features had been migrated and this legacy version was **no longer in use**.

## Can I run this code?

The project has many **obsolete dependencies** and uses **deprecated APIs**. The purpose of this repository is to provide a **historical archive** of the code for curious readers. It may be possible to run it by removing many features and making major changes, but I will not put time towards this goal.

## Why open source it now?

I was asked to open source this bot so much back in 2015-2017 that it became a running gag. I was not quite ready for that back then for many reasons. Part of it is because I was not particularly proud of the code and how it was designed. Looking back now, I get a nostalgic feeling about the experience. I realize how much **I learned** and **I have grown** working on this project. I want to open source it and take the opportunity to **reflect on what I took away** from it.

## Lessons

This project will always have a special place in my heart as it was one of the first projects I was passionate about. It helped me connect with an amazing community of people, many of which became friends. I had only started programming and had no experience with JavaScript. **Thank you so much to [@Donran](https://github.com/Donran/), [@EnchantedLuna](https://github.com/EnchantedLuna/) and [@richmoj3](https://github.com/richmoj3/)**, three more experienced programmers from who I learned a lot. I enjoyed going back and forth with you guys and becoming a better developer in the process.

### Small fun projects can become big fast

When I started TaylorBot, I was curious about making a bot that interacts with the Discord API and diving into web technologies. I was mostly toying around with this small one file script and did not think much of it. I was just having fun with a couple of friends.

One thing led to another and TaylorBot became a central part of the server culture. Discord continued to grow into one of the most used chat platforms in the world and our community kept growing with it. My small hobby script was now much more important and I kept adding lines of code to it. In hindsight, I should have taken it more seriously earlier on to prevent it from getting to this point.

For the first 6 months of the project, I did not even use version control. I can not stress this enough, but always use version control! When I start something new, it is barely any effort to run `git init` and commit changes as it evolves. These simple steps save quite a bit of headache in the future when I want to understand how the code changed, when I want to revert a particular change, when I want to backup my code or when I want more people to contribute to it.

### JavaScript is much better than it used to be

JavaScript is often criticized for its oddities that almost seem like bugs. While that is fair, some do not know how the language has evolved to become much more interesting and include features we see in other beloved languages.

[ES2015](https://en.wikipedia.org/wiki/ECMAScript#ES2015) was still relatively new when I started TaylorBot but I wish I looked into modern JavaScript features earlier on. I used `var` instead of `const` and `let`, which caused multiple bugs that were hard to diagnose. I used the callback paradigm of Node.js instead of the `Promise` object, which allows for more readable async code. I also did not know syntax existed for proper classes in JavaScript, which was one of the major reasons why the project became a single bloated file.

In addition, I should have used better tools from the start. When writing pure JavaScript, a linter like [ESLint](https://eslint.org/) is pretty much required, not only to make code style consistent, but also to prevent some obvious bugs. I was not familiar with [TypeScript](https://www.typescriptlang.org/) back then either, which is an amazing language built on top of JavaScript.

### Feature creep

I liked working on TaylorBot so much that I would add features on top of features without much thought. I eventually started experiencing feature creep: my bot became bloated with more and more commands that nobody needed. This only accentuated the various problems the project already had. In the end, I was investing time into things that were not important for end users.

I learned that it is a better investment to focus on features my product is doing right and polish their design or build on top of them.

### Dependencies

There is a large JavaScript community willing to push useful open source packages to NPM. I would accumulate more and more of these dependencies, which would speed up my development process, but would also mean I had less control over what my software was doing. I opened up myself to depending on projects that were not actively maintained, needed version upgrades and could introduce breaking changes.

I realized that I must properly think things through before adding a specific dependency to my project. Do I really need it? Could I write a minimal implementation that is good enough for my use case? Is it actively maintained? Is it perceived as a quality library by a significant amount of people in the community? What transitive dependencies would it bring to my project? Nowadays, I try to minimize dependencies where I can.

### Rewriting a project takes time

After a year of working on TaylorBot, I had already learned more about JavaScript and designing better software in general. I knew it probably would benefit from a rewrite, but told myself it would take a while and would not bring meaningful improvements to end users. This is partly right, but this problem only gets bigger with time. The original source was not sustainable for the long term and I should have foreseen that I would be working on TaylorBot for many years. Adding features to it only meant I was adding more technical debt I had to deal with eventually. When I finally did, it took me over a year to rewrite it completely, during which the bot did not gain many new features.

This is easy to say in hindsight, but I should have designed better software from the start. Even when I think my code is properly designed, I probably will have a different vision years from now. I learned that I have to invest time periodically to address technical debt so the code always improves with the product itself. Although it adds a bit of overhead, I also try to build software in a modular fashion, so different components can benefit from different technologies and design choices.

### Bad code can still provide good experiences

When I think about software engineering now, I spend a considerable amount of time focusing on code quality. This is an area in which this project was severely lacking. Yet, when I look back, I remember the countless hours I put into it out of pure love for the community I built it for. Despite the underlying source being mediocre, the shared experiences and fun we had with the bot is what really mattered. I realized it has to start somewhere, and maybe the bloated, inconsistent, buggy code was good enough back then to make our days a little better.
