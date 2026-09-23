const fs = require('fs');
const file = 'src/components/teacher/course-management-page.tsx';
let content = fs.readFileSync(file, 'utf8');

const seoSection = '<Card className="bsortOrder shadow-sm mt-6">\n' +
'                    <CardContent className="p-6 space-y-5">\n' +
'                      <div className="flex items-center justify-between">\n' +
'                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">\n' +
'                          <Settings className="h-5 w-5 text-amber-500" />\n' +
'                          SEO Settings\n' +
'                        </h3>\n' +
'                        <div className="flex items-center gap-2">\n' +
'                          <Label htmlFor="autoSeo" className="text-sm font-medium cursor-pointer">Auto Generate SEO</Label>\n' +
'                          <Switch\n' +
'                            id="autoSeo"\n' +
'                            checked={form.autoGenerateSeo}\n' +
'                            onCheckedChange={(v) => updateForm({ autoGenerateSeo: v })}\n' +
'                          />\n' +
'                        </div>\n' +
'                      </div>\n' +
'\n' +
'                      {!form.autoGenerateSeo && (\n' +
'                        <div className="grid gap-4 mt-4 border-t pt-4">\n' +
'                          <div className="grid gap-2">\n' +
'                            <Label htmlFor="seoTitle" className="text-sm font-medium">SEO Title</Label>\n' +
'                            <Input\n' +
'                              id="seoTitle"\n' +
'                              value={form.seoTitle}\n' +
'                              onChange={(e) => updateForm({ seoTitle: e.target.value })}\n' +
'                              placeholder="SEO Title"\n' +
'                            />\n' +
'                          </div>\n' +
'                          <div className="grid gap-2">\n' +
'                            <Label htmlFor="seoDescription" className="text-sm font-medium">SEO Description</Label>\n' +
'                            <Textarea\n' +
'                              id="seoDescription"\n' +
'                              value={form.seoDescription}\n' +
'                              onChange={(e) => updateForm({ seoDescription: e.target.value })}\n' +
'                              placeholder="SEO Description"\n' +
'                              className="h-24"\n' +
'                            />\n' +
'                          </div>\n' +
'                        </div>\n' +
'                      )}\n' +
'                    </CardContent>\n' +
'                  </Card>';

content = content.replace(
  '                  <Card className="bsortOrder shadow-sm">',
  seoSection + '\n                  <Card className="bsortOrder shadow-sm">'
);

fs.writeFileSync(file, content);
console.log('Added SEO UI');
