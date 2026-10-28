"""E2E: python3 tests/e2e.py [cdp_url] [app_url]. Serve dist/ on :8090 first."""
import sys
from playwright.sync_api import sync_playwright
CDP = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:29229'
URL = sys.argv[2] if len(sys.argv) > 2 else 'http://localhost:8090/'
ROUTES = ['overview', 'agents', 'runs', 'run/RUN-0002', 'enclave', 'spec', 'record', 'audit', 'data', 'shell', 'settings']
errs = []
def check(c, m):
    print(('PASS ' if c else 'FAIL ') + m)
    if not c: errs.append(m)
with sync_playwright() as p:
    b = p.chromium.connect_over_cdp(CDP)
    for name, vp in [('desktop', {'width': 1366, 'height': 900}), ('mobile', {'width': 390, 'height': 844})]:
        ctx = b.new_context(viewport=vp); pg = ctx.new_page(); cons = []
        pg.on('pageerror', lambda e: cons.append(str(e)))
        pg.on('console', lambda m: m.type == 'error' and cons.append(m.text))
        pg.goto(URL); pg.evaluate('localStorage.clear()'); pg.reload()
        for r in ROUTES:
            pg.goto(URL + '#/' + r); pg.wait_for_timeout(250)
            sw = pg.evaluate('document.documentElement.scrollWidth')
            check(sw <= vp['width'] + 1, f'{name} {r} no horizontal overflow ({sw})')
            pg.screenshot(path=f'tests/shots/{name}-{r.replace("/", "_")}.png', full_page=False)
        check(not cons, f'{name} no console errors {cons[:3]}')
        ctx.close()
    ctx = b.new_context(viewport={'width': 1366, 'height': 900}); pg = ctx.new_page(); cons = []
    pg.on('pageerror', lambda e: cons.append(str(e)))
    pg.goto(URL); pg.evaluate('localStorage.clear()'); pg.reload()
    # run refund that exceeds threshold -> held
    pg.goto(URL + '#/agents'); pg.select_option('#p-refund', 'T-1006'); pg.click('[data-act=run][data-sc=refund]'); pg.wait_for_timeout(300)
    check('#/run/RUN-0011' in pg.url, 'new run opened')
    st = pg.evaluate("S.runs[0].status"); print(' run status', st, pg.evaluate("S.runs[0].journal.map(j=>j.dec.rule)"))
    if st == 'awaiting':
        pg.click('[data-act=approve]'); pg.fill('input[name=pin]', '0000'); pg.click('form[data-form=pin] button.pri')
        check('Wrong PIN' in pg.inner_text('#pinerr'), 'wrong PIN refused')
        pg.fill('input[name=pin]', '1234'); pg.click('form[data-form=pin] button.pri'); pg.wait_for_timeout(200)
        check(pg.evaluate("S.runs[0].status") == 'done', 'approved run completes')
    pg.click('[data-act=replay]'); check('Identical' in pg.inner_text('main'), 'replay identical')
    pg.goto(URL + '#/run/RUN-0004'); pg.click('[data-act=whatif][data-spec]'); check('Counterfactual differs' in pg.inner_text('main'), 'what-if spec differs')
    pg.click('.step >> nth=0'); check('what the agent saw' in pg.inner_text('main'), 'step inspector')
    # record tamper
    pg.goto(URL + '#/record'); pg.click('[data-act=verify]'); check('Record verified' in pg.inner_text('main'), 'chain verified')
    pg.click('[data-act=tamper]'); pg.click('[data-act=verify]'); check('Tamper detected' in pg.inner_text('main'), 'tamper detected')
    pg.click('[data-act=untamper]'); check('Record verified' in pg.inner_text('main'), 'restored')
    pg.fill('[data-filter=q]', 'O’Brien'); pg.wait_for_timeout(400)
    # spec: draft, edit, sign
    pg.goto(URL + '#/spec'); pg.click('[data-act=newdraft]'); pg.click('[data-act=editrule][data-i="8"]')
    pg.fill('input[name=wv]', '250'); pg.click('form[data-form=rule] button.pri'); pg.wait_for_timeout(100)
    check('+ R9' in pg.inner_text('main'), 'diff shows change')
    pg.click('[data-act=signspec]'); pg.fill('input[name=note]', 'Lower threshold'); pg.fill('input[name=pin]', '1234'); pg.click('form[data-form=signspec] button.pri'); pg.wait_for_timeout(100)
    check(pg.evaluate('currentSpec().v') == 3, 'spec v3 signed')
    # enclave
    pg.goto(URL + '#/enclave'); pg.click('[data-act=curate][data-a=release]'); pg.wait_for_timeout(100)
    pg.click('[data-act=closevisit]'); check(pg.evaluate('S.visits[0].status') == 'closed', 'visit closed')
    pg.click('[data-act=admit]'); check(pg.evaluate('S.visits[0].status') == 'curating', 'new visit curating')
    # shell
    pg.goto(URL + '#/shell'); pg.fill('#shellin', 'replay RUN-0002'); pg.press('#shellin', 'Enter'); check('IDENTICAL' in pg.inner_text('#shellout'), 'shell replay')
    # audit
    pg.goto(URL + '#/audit'); check('atlas-7@2026-06' in pg.inner_text('main'), 'audit shows model version')
    pg.select_option('[data-aud=period]', 'Q4 2026'); check('atlas-8@2026-10' in pg.inner_text('main'), 'audit Q4')
    pg.goto(URL + '#/agents'); pg.click('[data-act=suspend][data-id=refund-resolver]'); check(pg.evaluate("agentById('refund-resolver').status") == 'suspended', 'suspend')
    check(pg.evaluate('verifyChain().ok'), 'chain still intact after all flows')
    pg.reload(); check(pg.evaluate('currentSpec().v') == 3, 'state persisted')
    check(not cons, f'flow no page errors {cons[:3]}')
    # mobile more sheet
    m = b.new_context(viewport={'width': 390, 'height': 844}); mp = m.new_page(); mp.goto(URL + '#/overview')
    mp.click('.bnav [data-act=more]'); mp.click('.sheet a[href="#/spec"]'); check('#/spec' in mp.url, 'mobile more sheet nav')
    # offline
    mp.goto(URL); mp.wait_for_timeout(1500); mp.reload(); mp.wait_for_timeout(500)
    m.set_offline(True); mp.reload(); check('WunderOS' in mp.inner_text('body'), 'works offline')
    m.close(); ctx.close()
print('FAILURES:', errs if errs else 'none'); sys.exit(1 if errs else 0)
