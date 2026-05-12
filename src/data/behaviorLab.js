export const behaviorLab = [
  {
    date: "2026-05-12",
    project: "Liahona",
    area: "DMs",
    context: "Direct message interaction",
    input: "User sends Liahona a private message.",
    output: "Liahona should send a normal DM message when it decides to respond.",
    worked: "DM support is included in the intended working surface.",
    failed: "Intermittent DM failures still require lifecycle log review.",
    expectedBehavior: "MESSAGE_RECEIVED through DELIVERY_RESULT should show where a failure occurs.",
    status: "watching"
  },
  {
    date: "2026-05-12",
    project: "Discord Systems",
    area: "forums",
    context: "Forum or thread conversation",
    input: "Multiple non-bot messages arrive in a thread.",
    output: "Liahona waits unless the interval is reached or it is directly mentioned.",
    worked: "Throttle reason is explicit when the system stays silent.",
    failed: "Long-term synthesis is not implemented yet.",
    expectedBehavior: "At most one response per configured interval unless mention bypass applies.",
    status: "active"
  },
  {
    date: "2026-05-12",
    project: "Website",
    area: "artifact",
    context: "Mobile artifact interaction",
    input: "User enables motion while holding the phone upright.",
    output: "Tilt is calibrated relative to the held position.",
    worked: "Baseline calibration and clamping are present.",
    failed: "Real-device Safari checks may still reveal edge cases.",
    expectedBehavior: "Artifact moves smoothly without cropping or black edge gaps.",
    status: "experimental"
  }
];
