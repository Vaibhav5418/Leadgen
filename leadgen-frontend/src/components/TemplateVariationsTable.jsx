import React from 'react';

const TemplateVariationsTable = ({ showVariations, type }) => {
  if (!showVariations) return null;

  if (type === 'linkedin') {
    return (
      <div className="p-4 bg-gray-50 overflow-y-auto flex-1">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-yellow-100">
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 border border-gray-300">Existing</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 border border-gray-300">Variation 1</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 border border-gray-300">Variation 2</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 border border-gray-300">Variation 3</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-900 bg-yellow-50 border border-gray-300 align-top">1st message</td>
                  <td className="px-4 py-3 text-xs text-gray-700 border border-gray-300 align-top">I'm usually in touch with teams managing residential projects and leasing, so I was just curious how you manage bookings, rentals, and property maintenance across your units.</td>
                  <td className="px-4 py-3 text-xs text-gray-700 border border-gray-300 align-top">I mostly connect with people working in residential and leasing roles—it keeps me close to how things really move on a day-to-day basis.</td>
                  <td className="px-4 py-3 text-xs text-gray-700 border border-gray-300 align-top">The world today feels like one connected marketplace, and being part of the real estate ecosystem, I enjoy connecting with people who are building and managing things on the ground. Looking forward to connecting and exchanging perspectives.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-900 bg-yellow-50 border border-gray-300 align-top">2nd Message</td>
                  <td className="px-4 py-3 text-xs text-gray-700 border border-gray-300 align-top">I've noticed that no two property teams manage bookings, rentals, and maintenance the same way. I'm always interested in hearing how others handle it in practice.</td>
                  <td className="px-4 py-3 text-xs text-gray-700 border border-gray-300 align-top">Always open to exchanging thoughts and learning how things are shaping up on your side. Would be great to stay connected.</td>
                  <td className="px-4 py-3 text-xs text-gray-700 border border-gray-300 align-top">We work closely with property teams to simplify how day-to-day operations are managed — from rentals and billing to maintenance — so things feel more connected and easier to handle.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-900 bg-yellow-50 border border-gray-300 align-top">3rd Message</td>
                  <td className="px-4 py-3 text-xs text-gray-700 border border-gray-300 align-top">Everyday operational conversations around properties quietly offer the most value in understanding how things really work.</td>
                  <td className="px-4 py-3 text-xs text-gray-700 border border-gray-300 align-top">Enjoy grounded conversations around real work and real challenges. Happy to stay connected and exchange insights whenever it makes sense.</td>
                  <td className="px-4 py-3 text-xs text-gray-700 border border-gray-300 align-top">We believe real value often comes from reducing small operational frictions and giving teams better visibility into what's happening across their properties.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-900 bg-yellow-50 border border-gray-300 align-top">4th Message</td>
                  <td className="px-4 py-3 text-xs text-gray-700 border border-gray-300 align-top">I'm always interested in seeing how teams optimize their workflows—do you have any strategies that make managing bookings and maintenance simpler?</td>
                  <td className="px-4 py-3 text-xs text-gray-700 border border-gray-300 align-top">I value thoughtful conversations with people close to the work. Whenever it feels right, I'd enjoy exchanging insights as things evolve on your side.</td>
                  <td className="px-4 py-3 text-xs text-gray-700 border border-gray-300 align-top">No worries if you didn't catch my earlier message. Just checking if you're up for a chat about possible ways we can team up and grow together.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'email') {
    return (
      <div className="p-4 bg-gray-50 overflow-y-auto flex-1">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-yellow-100">
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 border border-gray-300 w-[15%]">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 border border-gray-300">Variation 1</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 border border-gray-300">Variation 2</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 border border-gray-300">Variation 3</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 border border-gray-300">Variation 4</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-900 bg-yellow-50 border border-gray-300 align-top">1st Email</td>
                  <td className="px-4 py-3 text-xs text-gray-700 border border-gray-300 align-top">
                    <div className="space-y-2">
                      <p>Hi {'{{Name}}'},</p>
                      <p>I work closely with people involved in residential projects and leasing, and I enjoy staying connected with those who are close to the day-to-day side of property work.</p>
                      <p>At Terabits, we focus on making everyday property operations a little easier by keeping rentals, billing, and maintenance in one place.</p>
                      <p>Happy to connect.</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 border border-gray-300 align-top">
                    <div className="space-y-2">
                      <p>Hi {'{{Name}}'},</p>
                      <p>I usually stay in touch with people working close to residential projects and leasing. I've found those conversations tend to be the most honest and practical.</p>
                      <p>I'm part of the Terabits team, where we focus on making everyday property operations easier to manage.</p>
                      <p>Nice to connect.</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 border border-gray-300 align-top">
                    <div className="space-y-2">
                      <p className="font-semibold">Subject: Exchanging notes on leasing & residential work</p>
                      <p>Hi {'{{Name}}'},</p>
                      <p>I usually stay in touch with people working on residential projects and leasing. I've found these conversations to be the most practical.</p>
                      <p>When it comes to daily management, where do you usually find the most friction or "extra work" in your current process?</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 border border-gray-300 align-top">
                    <div className="space-y-2">
                      <p>Hi {'{{Name}}'},</p>
                      <p>I tend to reach out to people in residential leasing because the conversations are usually more practical.</p>
                      <p>I'm curious—when it comes to your daily management, where do things usually get stuck or feel like a "headache" for your team?</p>
                      <p>Nice to connect,</p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-900 bg-yellow-50 border border-gray-300 align-top">2nd Email</td>
                  <td className="px-4 py-3 text-xs text-gray-700 border border-gray-300 align-top">
                    <div className="space-y-2">
                      <p>Hi {'{{Name}}'},</p>
                      <p>Just wanted to follow up on my last note.</p>
                      <p>We usually speak with property teams who want a bit more clarity in their daily workflows without changing how they already operate.</p>
                      <p>Always good to stay in touch.</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 border border-gray-300 align-top">
                    <div className="space-y-2">
                      <p>Hi {'{{Name}}'},</p>
                      <p>Just sharing a short follow-up.</p>
                      <p>Most of our discussions with property teams revolve around simplifying rentals, maintenance, and billing without adding extra complexity to daily work.</p>
                      <p>Happy to stay in touch.</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 border border-gray-300 align-top">
                    <div className="space-y-2">
                      <p>Hi {'{{Name}}'},</p>
                      <p>Most of our discussions with property teams revolve around simplifying rentals, maintenance, and billing.</p>
                      <p>This is where Terabits usually steps in—we focus on making those everyday operations feel less like a chore so you can focus on the bigger picture.</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 border border-gray-300 align-top">
                    <div className="space-y-2">
                      <p>Hi {'{{Name}}'},</p>
                      <p>That's usually where we come in. At Terabits, we focus on making those messy parts—like rentals, maintenance, and billing—feel a lot more manageable.</p>
                      <p>We try to keep the tech simple so it actually helps the team instead of adding more work to their day.</p>
                      <p>Happy to stay in touch,</p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-900 bg-yellow-50 border border-gray-300 align-top">3rd Email</td>
                  <td className="px-4 py-3 text-xs text-gray-700 border border-gray-300 align-top">
                    <div className="space-y-2">
                      <p>Hi {'{{Name}}'},</p>
                      <p>One thing we often notice is that small improvements in visibility can make day-to-day property work feel much more manageable.</p>
                      <p>Thought I'd share that with you.</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 border border-gray-300 align-top">
                    <div className="space-y-2">
                      <p>Hi {'{{Name}}'},</p>
                      <p>One thing I often hear is that even small clarity in systems can make a big difference in day-to-day property operations.</p>
                      <p>Thought I'd share that with you.</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 border border-gray-300 align-top">
                    <div className="space-y-2">
                      <p>Hi {'{{Name}}'},</p>
                      <p>One thing I often hear is that small clarity in systems makes a big difference.</p>
                      <p>Specifically, we help by automating the repetitive stuff—like tracking maintenance requests or streamlining billing workflows—without adding extra complexity to your day-to-day work.</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 border border-gray-300 align-top">
                    <div className="space-y-2">
                      <p>Hi {'{{Name}}'},</p>
                      <p>One thing I've noticed is that just adding a bit of clarity to maintenance tracking or billing can save a lot of hours.</p>
                      <p>We mostly help by automating those repetitive tasks so they just happen in the background. It's a small change that usually makes the day-to-day much smoother.</p>
                      <p>Thought I'd share that.</p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-900 bg-yellow-50 border border-gray-300 align-top">4th Email</td>
                  <td className="px-4 py-3 text-xs text-gray-700 border border-gray-300 align-top">
                    <div className="space-y-2">
                      <p>Hi {'{{Name}}'},</p>
                      <p>I'll leave it here for now.</p>
                      <p>If at any point it feels useful to exchange notes around property operations or workflows, I'm always happy to connect.</p>
                      <p>Wishing you a great week ahead.</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 border border-gray-300 align-top">
                    <div className="space-y-2">
                      <p>Hi {'{{Name}}'},</p>
                      <p>I won't take more of your time.</p>
                      <p>If at any point it feels useful to exchange notes around property operations or workflows, I'm always happy to connect.</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 border border-gray-300 align-top">
                    <div className="space-y-2">
                      <p>Hi {'{{Name}}'},</p>
                      <p>I won't take more of your time.</p>
                      <p>If at any point it feels useful to exchange notes around property operations or workflows, I'm always happy to connect.</p>
                      <p>Take care.</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 border border-gray-300 align-top">
                    <div className="space-y-2">
                      <p>Hi {'{{Name}}'},</p>
                      <p>I'll leave it here as I don't want to crowd your inbox.</p>
                      <p>If you ever want to swap notes on how to make property workflows easier, I'm always happy to chat.</p>
                      <p>Wishing you the best,</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default TemplateVariationsTable;
