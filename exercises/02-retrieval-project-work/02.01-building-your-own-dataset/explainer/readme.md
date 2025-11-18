Now that you understand retrieval, it's time to build the dataset that will power your personal AI assistant.

The beauty of this system is flexibility. You're not limited to emails - your retrieval will work on any JSON array. Whether you have personal notes, meeting transcripts, journal entries, or local documentation, you can pull it all in and make your AI grounded in your own information.

The minimum structure is simple: an `id`, a `subject` or title, and the `content`. That's it. This could be a knowledge base, wiki, or documentation site for a library you want to integrate.

Aim for around 200 items or more so you can properly test your retrieval algorithm. If that sounds like too much work, you can use the prepared email dataset - 576 emails that will give you a realistic idea of working with these systems (though it will cost more in embeddings than the 150-email dataset in the skill building repo).

## Steps To Complete

### Choose Your Data Source

- [ ] Decide what data source you'll use

Consider your options:

- Personal notes or a note-taking system you already use
- Meeting transcripts or journal entries
- A knowledge base or wiki
- Documentation for a library or tool
- The pre-built email dataset provided (576 emails)
- A combination of multiple sources

### Format Your Data

- [ ] Gather and format your data as JSON

Your dataset should be a JSON array with objects containing at minimum:

- `id` - A unique identifier for each item
- `subject` or `title` - A brief heading or subject line
- `content` - The full text or body of the item

```json
[
  {
    "id": "note-001",
    "subject": "Project kickoff notes",
    "content": "Met with team to discuss Q1 roadmap..."
  },
  {
    "id": "note-002",
    "subject": "Client feedback summary",
    "content": "Key feedback points from last review..."
  }
]
```

### Validate Your Dataset Size

- [ ] Ensure your dataset has at least 200 items

This gives you enough data to test your retrieval algorithm meaningfully. If you're using the prepared emails, you already have 576 items.

### Save Your Data

- [ ] Save your data locally as a JSON file or Markdown files

Store this on your file system where you can access it for the next exercise.

### Get Help If Needed

- [ ] Ask in Discord if you hit any blockers

The community is there to help if you have questions about formatting, data sources, or anything else.

Once your dataset is ready with 200+ items, you're set to move forward to the next exercise. Good luck!
