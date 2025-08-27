const submitPluginReport = async (
  owner: string,
  name: string,
  reportCategory: string,
  reportDescription: string
) => {
  if (!reportCategory) {
    alert("Please select a reason for the report.");
    return;
  }
  /* PMK pretty please add webook :) -palm */
  const webhookUrl = "";

  const embedPayload = {
    embeds: [
      {
        title: "🚨 Plugin Report",
        color: 0xed4245, // Red
        fields: [
          {
            name: "Plugin",
            value: `[${owner}/${name}](https://github.com/${owner}/${name})`,
            inline: true,
          },
          {
            name: "Author",
            value: `[${owner}](https://github.com/${owner})`,
            inline: true,
          },
          {
            name: "Reason",
            value: reportCategory,
          },
          {
            name: "Description",
            value: reportDescription,
          },
        ],
        footer: {
          text: "Report submitted by Anonymous.",
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(embedPayload),
    });

    if (response.ok) {
      return true;
    } else {
      alert(`Failed to send report. (Error: ${response.status})`);
    }
  } catch (error) {
    console.error("Error submitting report:", error);
    alert("An error occurred while sending this report. Please report this.");
  }
};

export { submitPluginReport };
