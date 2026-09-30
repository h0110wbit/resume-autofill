// Popup Script - 用户信息管理与 PDF 导入

document.addEventListener('DOMContentLoaded', () => {
  loadData();
  applyPendingPdfProfile();
  bindEvents();
});

// ===== 数据加载 =====
function loadData() {
  chrome.storage.local.get(null, result => {
    // LLM 配置
    const llm = result.llm || {};
    document.getElementById('llm-baseUrl').value = llm.baseUrl || '';
    document.getElementById('llm-apiKey').value = llm.apiKey || '';
    document.getElementById('llm-model').value = llm.model || '';

    // 基本信息
    const basic = result.basic || {};
    setVal('basic-name', basic.name);
    setVal('basic-gender', basic.gender);
    setVal('basic-birthday', basic.birthday);
    setVal('basic-phone', basic.phone);
    setVal('basic-email', basic.email);
    setVal('basic-location', basic.location);
    setVal('basic-hukou', basic.hukou);
    setVal('basic-nativePlace', basic.nativePlace);
    setVal('basic-ethnicity', basic.ethnicity);
    setVal('basic-political', basic.political);
    setVal('basic-marital', basic.marital);
    setVal('basic-workYears', basic.workYears);
    setVal('basic-availableDate', basic.availableDate);
    setVal('basic-jobStatus', basic.jobStatus);
    setVal('basic-currentSalary', basic.currentSalary);
    setVal('basic-address', basic.address);
    setVal('basic-website', basic.website);
    setVal('basic-github', basic.github);
    setVal('basic-wechat', basic.wechat);
    setVal('basic-idCard', basic.idCard);
    setVal('basic-height', basic.height);
    setVal('basic-weight', basic.weight);
    setVal('basic-emergencyName', basic.emergencyName);
    setVal('basic-emergencyPhone', basic.emergencyPhone);

    // 其他信息（扩展字段）
    const extra = result.extra || {};
    setVal('extra-nativeProvince', extra.nativeProvince);
    setVal('extra-nativeCity', extra.nativeCity);
    setVal('extra-nativeDistrict', extra.nativeDistrict);
    setVal('extra-gaokaoProvince', extra.gaokaoProvince);
    setVal('extra-gaokaoCity', extra.gaokaoCity);
    setVal('extra-gaokaoDistrict', extra.gaokaoDistrict);
    setVal('extra-hukouProvince', extra.hukouProvince);
    setVal('extra-hukouCity', extra.hukouCity);
    setVal('extra-hukouDistrict', extra.hukouDistrict);
    setVal('extra-homeProvince', extra.homeProvince);
    setVal('extra-homeCity', extra.homeCity);
    setVal('extra-homeDistrict', extra.homeDistrict);
    setVal('extra-health', extra.health);

    // 学历补充信息
    const eduExtra = result.educationExtra || {};
    setVal('eduExtra-highestDegree', eduExtra.highestDegree);
    setVal('eduExtra-educationType', eduExtra.educationType);
    setRadioVal('eduExtra-isMain', eduExtra.isMain);
    setRadioVal('eduExtra-hasDoubleDegree', eduExtra.hasDoubleDegree);
    setRadioVal('eduExtra-isUpgraded', eduExtra.isUpgraded);

    // 高中信息
    const highSchool = result.highSchool || {};
    fillProvinceSelect('highSchool-province', highSchool.province);
    fillCitySelect('highSchool-city', highSchool.province, highSchool.city);
    setVal('highSchool-school', highSchool.school);
    setVal('highSchool-startDate', highSchool.startDate);
    setVal('highSchool-endDate', highSchool.endDate);
    setRadioVal('highSchool-isMain', highSchool.isMain);

    // 学位与专业信息
    const degreeInfo = result.degreeInfo || {};
    setVal('degreeInfo-degree', degreeInfo.degree);
    setSelectVal('degreeInfo-degreeType', degreeInfo.degreeType);
    setVal('degreeInfo-school', degreeInfo.school);
    setVal('degreeInfo-schoolLocation', degreeInfo.schoolLocation);
    setVal('degreeInfo-college', degreeInfo.college);
    setVal('degreeInfo-majorLevel1', degreeInfo.majorLevel1);
    setVal('degreeInfo-majorLevel2', degreeInfo.majorLevel2);
    setVal('degreeInfo-majorDirection', degreeInfo.majorDirection);
    setRadioVal('degreeInfo-isStudentLeader', degreeInfo.isStudentLeader);

    // 家庭成员 / 亲属
    renderRelativeList(result.relatives || []);

    // 教育经历
    renderEducationList(result.education || []);

    // 工作经历
    renderWorkList(result.work || []);

    // 项目经历
    renderProjectList(result.projects || []);

    // 资格证书与语言
    setVal('languages', result.languages);
    setVal('certificates', result.certificates);

    // 求职意向
    const intention = result.jobIntention || {};
    setVal('intention-position', intention.position);
    setVal('intention-salary', intention.salary);
    setVal('intention-city', intention.city);
    setVal('intention-type', intention.type);
    setVal('intention-industry', intention.industry);
    setVal('intention-currentAnnual', intention.currentAnnual);

    // 专业技能
    setVal('skills', result.skills);

    // 自我评价
    setVal('self-evaluation', result.selfEvaluation);
  });
}

function setVal(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  let v = value || '';
  // 原生 date 输入框只接受 YYYY-MM-DD，简历常见 YYYY-MM → 补 "-01" 避免被置空
  if (el.type === 'date' && /^\d{4}-\d{1,2}$/.test(v)) v += '-01';
  // 原生 month 输入框只接受 YYYY-MM，只有年份时补 "-01"
  if (el.type === 'month' && /^\d{4}$/.test(v)) v += '-01';
  el.value = v;
}

function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

// 单选组（是 / 否）
function setRadioVal(name, value) {
  const v = (value == null ? '' : String(value)).trim();
  document.querySelectorAll(`input[name="${name}"]`).forEach(el => {
    el.checked = !!v && el.value === v;
  });
}

function getRadioVal(name) {
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : '';
}

// 下拉框赋值：值不在内置选项中时（如 PDF 导入的自由文本）补一个选项，避免被清空
function setSelectVal(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  const v = (value == null ? '' : String(value)).trim();
  if (v && !Array.from(el.options).some(o => o.value === v)) {
    el.insertAdjacentHTML('beforeend', `<option value="${esc(v)}">${esc(v)}</option>`);
  }
  el.value = v;
}

// 高中就读院校：省份/城市级联下拉
function fillProvinceSelect(id, selected) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = '<option value="">请选择</option>' +
    Object.keys(PROVINCE_CITIES).map(p => `<option value="${esc(p)}">${esc(p)}</option>`).join('');
  setSelectVal(id, selected);
}

function fillCitySelect(id, province, selected) {
  const el = document.getElementById(id);
  if (!el) return;
  const cities = PROVINCE_CITIES[province] || [];
  el.innerHTML = '<option value="">请选择</option>' +
    cities.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
  setSelectVal(id, selected);
}

// ===== 教育经历列表 =====
function renderEducationList(list) {
  const container = document.getElementById('education-list');
  container.innerHTML = '';
  if (list.length === 0) list = [{}];

  list.forEach((edu, index) => {
    container.appendChild(createEducationCard(edu, index));
  });
}

function createEducationCard(data, index) {
  const card = document.createElement('div');
  card.className = 'entry-card';
  card.dataset.index = index;
  card.innerHTML = `
    <div class="entry-header">
      <span class="entry-title">教育经历 ${index + 1}</span>
      <button class="btn-remove" title="删除">×</button>
    </div>
    <div class="field-row">
      <div class="field"><label>学校</label><input type="text" data-key="school" value="${esc(data.school)}"></div>
      <div class="field"><label>专业</label><input type="text" data-key="major" value="${esc(data.major)}"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>学历</label>
        <select data-key="degree">
          <option value="">请选择</option>
          ${['大专', '本科', '硕士', '博士', 'MBA', '其他'].map(d =>
    `<option value="${d}" ${data.degree === d ? 'selected' : ''}>${d}</option>`
  ).join('')}
        </select>
      </div>
      <div class="field"><label>学制</label><input type="text" data-key="duration" value="${esc(data.duration)}" placeholder="如：4年"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>是否统招</label>
        <select data-key="isRegular">
          <option value="">请选择</option>
          <option value="统招" ${data.isRegular === '统招' ? 'selected' : ''}>统招</option>
          <option value="自考" ${data.isRegular === '自考' ? 'selected' : ''}>自考</option>
          <option value="成考" ${data.isRegular === '成考' ? 'selected' : ''}>成考</option>
          <option value="网教" ${data.isRegular === '网教' ? 'selected' : ''}>网教</option>
        </select>
      </div>
      <div class="field"><label>GPA/排名</label><input type="text" data-key="gpa" value="${esc(data.gpa)}" placeholder="如：3.8/4.0 或 Top 10%"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>开始时间</label><input type="month" data-key="startDate" value="${esc(data.startDate)}"></div>
      <div class="field"><label>结束时间</label>
        <div class="date-with-present">
          <input type="month" data-key="endDate" value="${esc(data.endDate)}" ${data.endDate === '至今' ? 'disabled' : ''}>
          <label class="present-label"><input type="checkbox" data-key="isPresent" ${data.endDate === '至今' ? 'checked' : ''}> 至今</label>
        </div>
      </div>
    </div>
    <div class="field"><label>在校经历</label><textarea data-key="description" rows="2">${esc(data.description)}</textarea></div>
    <div class="field"><label>获奖/荣誉</label><textarea data-key="awards" rows="2" placeholder="奖学金、竞赛获奖等...">${esc(data.awards)}</textarea></div>
    <div class="field"><label>论文/专利</label><textarea data-key="publications" rows="1" placeholder="论文标题、专利号...">${esc(data.publications)}</textarea></div>
  `;

  card.querySelector('.btn-remove').addEventListener('click', () => {
    card.remove();
    reindexCards('education-list', '教育经历');
    scheduleSave();
  });

  return card;
}

// ===== 工作经历列表 =====
function renderWorkList(list) {
  const container = document.getElementById('work-list');
  container.innerHTML = '';
  if (list.length === 0) list = [{}];

  list.forEach((work, index) => {
    container.appendChild(createWorkCard(work, index));
  });
}

function createWorkCard(data, index) {
  const card = document.createElement('div');
  card.className = 'entry-card';
  card.dataset.index = index;
  card.innerHTML = `
    <div class="entry-header">
      <span class="entry-title">工作经历 ${index + 1}</span>
      <button class="btn-remove" title="删除">×</button>
    </div>
    <div class="field-row field-row-3">
      <div class="field"><label>公司</label><input type="text" data-key="company" value="${esc(data.company)}"></div>
      <div class="field"><label>部门</label><input type="text" data-key="department" value="${esc(data.department)}"></div>
      <div class="field"><label>职位</label><input type="text" data-key="position" value="${esc(data.position)}"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>工作类型</label>
        <select data-key="type">
          <option value="">请选择</option>
          <option value="全职" ${data.type === '全职' ? 'selected' : ''}>全职</option>
          <option value="实习" ${data.type === '实习' ? 'selected' : ''}>实习</option>
          <option value="兼职" ${data.type === '兼职' ? 'selected' : ''}>兼职</option>
        </select>
      </div>
      <div class="field"><label>工作城市</label><input type="text" data-key="city" value="${esc(data.city)}"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>开始时间</label><input type="month" data-key="startDate" value="${esc(data.startDate)}"></div>
      <div class="field"><label>结束时间</label>
        <div class="date-with-present">
          <input type="month" data-key="endDate" value="${esc(data.endDate)}" ${data.endDate === '至今' ? 'disabled' : ''}>
          <label class="present-label"><input type="checkbox" data-key="isPresent" ${data.endDate === '至今' ? 'checked' : ''}> 至今</label>
        </div>
      </div>
    </div>
    <div class="field"><label>工作描述</label><textarea data-key="description" rows="3">${esc(data.description)}</textarea></div>
  `;

  card.querySelector('.btn-remove').addEventListener('click', () => {
    card.remove();
    reindexCards('work-list', '工作经历');
    scheduleSave();
  });

  return card;
}

// ===== 项目经历列表 =====
function renderProjectList(list) {
  const container = document.getElementById('project-list');
  container.innerHTML = '';
  if (list.length === 0) list = [{}];

  list.forEach((proj, index) => {
    container.appendChild(createProjectCard(proj, index));
  });
}

function createProjectCard(data, index) {
  const card = document.createElement('div');
  card.className = 'entry-card';
  card.dataset.index = index;
  card.innerHTML = `
    <div class="entry-header">
      <span class="entry-title">项目经历 ${index + 1}</span>
      <button class="btn-remove" title="删除">×</button>
    </div>
    <div class="field-row">
      <div class="field"><label>项目名称</label><input type="text" data-key="projectName" value="${esc(data.projectName)}"></div>
      <div class="field"><label>担任角色</label><input type="text" data-key="role" value="${esc(data.role)}"></div>
    </div>
    <div class="field"><label>技术栈</label><input type="text" data-key="techStack" value="${esc(data.techStack)}" placeholder="React, Node.js, MySQL"></div>
    <div class="field-row">
      <div class="field"><label>开始时间</label><input type="month" data-key="startDate" value="${esc(data.startDate)}"></div>
      <div class="field"><label>结束时间</label>
        <div class="date-with-present">
          <input type="month" data-key="endDate" value="${esc(data.endDate)}" ${data.endDate === '至今' ? 'disabled' : ''}>
          <label class="present-label"><input type="checkbox" data-key="isPresent" ${data.endDate === '至今' ? 'checked' : ''}> 至今</label>
        </div>
      </div>
    </div>
    <div class="field"><label>项目描述</label><textarea data-key="description" rows="3">${esc(data.description)}</textarea></div>
  `;

  card.querySelector('.btn-remove').addEventListener('click', () => {
    card.remove();
    reindexCards('project-list', '项目经历');
    scheduleSave();
  });

  return card;
}

function reindexCards(containerId, prefix) {
  const cards = document.querySelectorAll(`#${containerId} .entry-card`);
  cards.forEach((card, i) => {
    card.dataset.index = i;
    card.querySelector('.entry-title').textContent = `${prefix} ${i + 1}`;
  });
}

// ===== 家庭成员 / 亲属列表 =====
let relativeUid = 0;

function renderRelativeList(list) {
  const container = document.getElementById('relative-list');
  container.innerHTML = '';
  if (!Array.isArray(list) || list.length === 0) list = [{}];

  list.forEach((rel, index) => {
    container.appendChild(createRelativeCard(rel, index));
  });
}

function createRelativeCard(data, index) {
  const card = document.createElement('div');
  card.className = 'entry-card';
  card.dataset.index = index;
  // 单选组的 name 必须全局唯一，否则不同卡片的"是/否"会互相取消
  const radioName = `relative-isEmployee-${++relativeUid}`;
  card.innerHTML = `
    <div class="entry-header">
      <span class="entry-title">亲属信息 ${index + 1}</span>
      <button class="btn-remove" title="删除">×</button>
    </div>
    <div class="field-row">
      <div class="field"><label>亲属称谓</label><input type="text" data-key="relation" value="${esc(data.relation)}" placeholder="如：父亲"></div>
      <div class="field"><label>亲属姓名</label><input type="text" data-key="name" value="${esc(data.name)}"></div>
    </div>
    <div class="field">
      <label>是否为本单位员工</label>
      <div class="radio-group">
        <label class="radio-item"><input type="radio" name="${radioName}" data-key="isEmployee" value="是" ${data.isEmployee === '是' ? 'checked' : ''}>是</label>
        <label class="radio-item"><input type="radio" name="${radioName}" data-key="isEmployee" value="否" ${data.isEmployee === '否' ? 'checked' : ''}>否</label>
      </div>
    </div>
    <div class="field-row">
      <div class="field"><label>工作单位</label><input type="text" data-key="company" value="${esc(data.company)}"></div>
      <div class="field"><label>工作职务</label><input type="text" data-key="position" value="${esc(data.position)}"></div>
    </div>
  `;

  card.querySelector('.btn-remove').addEventListener('click', () => {
    card.remove();
    reindexCards('relative-list', '亲属信息');
    scheduleSave();
  });

  return card;
}

// 省 / 直辖市 → 城市（地级行政区）映射，用于「高中就读院校-省份/城市」级联下拉
const PROVINCE_CITIES = {
  '北京市': ['东城区', '西城区', '朝阳区', '丰台区', '石景山区', '海淀区', '门头沟区', '房山区', '通州区', '顺义区', '昌平区', '大兴区', '怀柔区', '平谷区', '密云区', '延庆区'],
  '天津市': ['和平区', '河东区', '河西区', '南开区', '河北区', '红桥区', '东丽区', '西青区', '津南区', '北辰区', '武清区', '宝坻区', '滨海新区', '宁河区', '静海区', '蓟州区'],
  '上海市': ['黄浦区', '徐汇区', '长宁区', '静安区', '普陀区', '虹口区', '杨浦区', '闵行区', '宝山区', '嘉定区', '浦东新区', '金山区', '松江区', '青浦区', '奉贤区', '崇明区'],
  '重庆市': ['渝中区', '江北区', '南岸区', '九龙坡区', '沙坪坝区', '渝北区', '巴南区', '北碚区', '大渡口区', '万州区', '涪陵区', '永川区', '合川区', '长寿区', '江津区', '綦江区', '南川区', '璧山区', '铜梁区', '大足区', '荣昌区', '潼南区', '开州区', '梁平区', '武隆区', '城口县', '丰都县', '垫江县', '忠县', '云阳县', '奉节县', '巫山县', '巫溪县', '石柱土家族自治县', '秀山土家族苗族自治县', '酉阳土家族苗族自治县', '彭水苗族土家族自治县'],
  '河北省': ['石家庄市', '唐山市', '秦皇岛市', '邯郸市', '邢台市', '保定市', '张家口市', '承德市', '沧州市', '廊坊市', '衡水市'],
  '山西省': ['太原市', '大同市', '阳泉市', '长治市', '晋城市', '朔州市', '晋中市', '运城市', '忻州市', '临汾市', '吕梁市'],
  '内蒙古自治区': ['呼和浩特市', '包头市', '乌海市', '赤峰市', '通辽市', '鄂尔多斯市', '呼伦贝尔市', '巴彦淖尔市', '乌兰察布市', '兴安盟', '锡林郭勒盟', '阿拉善盟'],
  '辽宁省': ['沈阳市', '大连市', '鞍山市', '抚顺市', '本溪市', '丹东市', '锦州市', '营口市', '阜新市', '辽阳市', '盘锦市', '铁岭市', '朝阳市', '葫芦岛市'],
  '吉林省': ['长春市', '吉林市', '四平市', '辽源市', '通化市', '白山市', '松原市', '白城市', '延边朝鲜族自治州'],
  '黑龙江省': ['哈尔滨市', '齐齐哈尔市', '鸡西市', '鹤岗市', '双鸭山市', '大庆市', '伊春市', '佳木斯市', '七台河市', '牡丹江市', '黑河市', '绥化市', '大兴安岭地区'],
  '江苏省': ['南京市', '无锡市', '徐州市', '常州市', '苏州市', '南通市', '连云港市', '淮安市', '盐城市', '扬州市', '镇江市', '泰州市', '宿迁市'],
  '浙江省': ['杭州市', '宁波市', '温州市', '嘉兴市', '湖州市', '绍兴市', '金华市', '衢州市', '舟山市', '台州市', '丽水市'],
  '安徽省': ['合肥市', '芜湖市', '蚌埠市', '淮南市', '马鞍山市', '淮北市', '铜陵市', '安庆市', '黄山市', '滁州市', '阜阳市', '宿州市', '六安市', '亳州市', '池州市', '宣城市'],
  '福建省': ['福州市', '厦门市', '莆田市', '三明市', '泉州市', '漳州市', '南平市', '龙岩市', '宁德市'],
  '江西省': ['南昌市', '景德镇市', '萍乡市', '九江市', '新余市', '鹰潭市', '赣州市', '吉安市', '宜春市', '抚州市', '上饶市'],
  '山东省': ['济南市', '青岛市', '淄博市', '枣庄市', '东营市', '烟台市', '潍坊市', '济宁市', '泰安市', '威海市', '日照市', '临沂市', '德州市', '聊城市', '滨州市', '菏泽市'],
  '河南省': ['郑州市', '开封市', '洛阳市', '平顶山市', '安阳市', '鹤壁市', '新乡市', '焦作市', '濮阳市', '许昌市', '漯河市', '三门峡市', '南阳市', '商丘市', '信阳市', '周口市', '驻马店市', '济源市'],
  '湖北省': ['武汉市', '黄石市', '十堰市', '宜昌市', '襄阳市', '鄂州市', '荆门市', '孝感市', '荆州市', '黄冈市', '咸宁市', '随州市', '恩施土家族苗族自治州', '仙桃市', '潜江市', '天门市', '神农架林区'],
  '湖南省': ['长沙市', '株洲市', '湘潭市', '衡阳市', '邵阳市', '岳阳市', '常德市', '张家界市', '益阳市', '郴州市', '永州市', '怀化市', '娄底市', '湘西土家族苗族自治州'],
  '广东省': ['广州市', '韶关市', '深圳市', '珠海市', '汕头市', '佛山市', '江门市', '湛江市', '茂名市', '肇庆市', '惠州市', '梅州市', '汕尾市', '河源市', '阳江市', '清远市', '东莞市', '中山市', '潮州市', '揭阳市', '云浮市'],
  '广西壮族自治区': ['南宁市', '柳州市', '桂林市', '梧州市', '北海市', '防城港市', '钦州市', '贵港市', '玉林市', '百色市', '贺州市', '河池市', '来宾市', '崇左市'],
  '海南省': ['海口市', '三亚市', '三沙市', '儋州市', '五指山市', '琼海市', '文昌市', '万宁市', '东方市', '定安县', '屯昌县', '澄迈县', '临高县', '白沙黎族自治县', '昌江黎族自治县', '乐东黎族自治县', '陵水黎族自治县', '保亭黎族苗族自治县', '琼中黎族苗族自治县'],
  '四川省': ['成都市', '自贡市', '攀枝花市', '泸州市', '德阳市', '绵阳市', '广元市', '遂宁市', '内江市', '乐山市', '南充市', '眉山市', '宜宾市', '广安市', '达州市', '雅安市', '巴中市', '资阳市', '阿坝藏族羌族自治州', '甘孜藏族自治州', '凉山彝族自治州'],
  '贵州省': ['贵阳市', '六盘水市', '遵义市', '安顺市', '毕节市', '铜仁市', '黔西南布依族苗族自治州', '黔东南苗族侗族自治州', '黔南布依族苗族自治州'],
  '云南省': ['昆明市', '曲靖市', '玉溪市', '保山市', '昭通市', '丽江市', '普洱市', '临沧市', '楚雄彝族自治州', '红河哈尼族彝族自治州', '文山壮族苗族自治州', '西双版纳傣族自治州', '大理白族自治州', '德宏傣族景颇族自治州', '怒江傈僳族自治州', '迪庆藏族自治州'],
  '西藏自治区': ['拉萨市', '日喀则市', '昌都市', '林芝市', '山南市', '那曲市', '阿里地区'],
  '陕西省': ['西安市', '铜川市', '宝鸡市', '咸阳市', '渭南市', '延安市', '汉中市', '榆林市', '安康市', '商洛市'],
  '甘肃省': ['兰州市', '嘉峪关市', '金昌市', '白银市', '天水市', '武威市', '张掖市', '平凉市', '酒泉市', '庆阳市', '定西市', '陇南市', '临夏回族自治州', '甘南藏族自治州'],
  '青海省': ['西宁市', '海东市', '海北藏族自治州', '黄南藏族自治州', '海南藏族自治州', '果洛藏族自治州', '玉树藏族自治州', '海西蒙古族藏族自治州'],
  '宁夏回族自治区': ['银川市', '石嘴山市', '吴忠市', '固原市', '中卫市'],
  '新疆维吾尔自治区': ['乌鲁木齐市', '克拉玛依市', '吐鲁番市', '哈密市', '昌吉回族自治州', '博尔塔拉蒙古自治州', '巴音郭楞蒙古自治州', '阿克苏地区', '克孜勒苏柯尔克孜自治州', '喀什地区', '和田地区', '伊犁哈萨克自治州', '塔城地区', '阿勒泰地区', '石河子市', '阿拉尔市', '图木舒克市', '五家渠市', '北屯市', '铁门关市', '双河市', '可克达拉市', '昆玉市', '胡杨河市'],
  '台湾省': ['台北市', '新北市', '桃园市', '台中市', '台南市', '高雄市', '基隆市', '新竹市', '嘉义市', '其他'],
  '香港特别行政区': ['香港岛', '九龙', '新界'],
  '澳门特别行政区': ['澳门半岛', '氹仔', '路环']
};

// ===== 收集表单数据 =====
function collectFormData() {
  const data = {
    llm: {
      baseUrl: getVal('llm-baseUrl'),
      apiKey: getVal('llm-apiKey'),
      model: getVal('llm-model')
    },
    basic: {
      name: getVal('basic-name'),
      gender: getVal('basic-gender'),
      birthday: getVal('basic-birthday'),
      phone: getVal('basic-phone'),
      email: getVal('basic-email'),
      location: getVal('basic-location'),
      hukou: getVal('basic-hukou'),
      nativePlace: getVal('basic-nativePlace'),
      ethnicity: getVal('basic-ethnicity'),
      political: getVal('basic-political'),
      marital: getVal('basic-marital'),
      workYears: getVal('basic-workYears'),
      availableDate: getVal('basic-availableDate'),
      jobStatus: getVal('basic-jobStatus'),
      currentSalary: getVal('basic-currentSalary'),
      address: getVal('basic-address'),
      website: getVal('basic-website'),
      github: getVal('basic-github'),
      wechat: getVal('basic-wechat'),
      idCard: getVal('basic-idCard'),
      height: getVal('basic-height'),
      weight: getVal('basic-weight'),
      emergencyName: getVal('basic-emergencyName'),
      emergencyPhone: getVal('basic-emergencyPhone')
    },
    extra: {
      nativeProvince: getVal('extra-nativeProvince'),
      nativeCity: getVal('extra-nativeCity'),
      nativeDistrict: getVal('extra-nativeDistrict'),
      gaokaoProvince: getVal('extra-gaokaoProvince'),
      gaokaoCity: getVal('extra-gaokaoCity'),
      gaokaoDistrict: getVal('extra-gaokaoDistrict'),
      hukouProvince: getVal('extra-hukouProvince'),
      hukouCity: getVal('extra-hukouCity'),
      hukouDistrict: getVal('extra-hukouDistrict'),
      homeProvince: getVal('extra-homeProvince'),
      homeCity: getVal('extra-homeCity'),
      homeDistrict: getVal('extra-homeDistrict'),
      health: getVal('extra-health')
    },
    educationExtra: {
      highestDegree: getVal('eduExtra-highestDegree'),
      educationType: getVal('eduExtra-educationType'),
      isMain: getRadioVal('eduExtra-isMain'),
      hasDoubleDegree: getRadioVal('eduExtra-hasDoubleDegree'),
      isUpgraded: getRadioVal('eduExtra-isUpgraded')
    },
    highSchool: {
      province: getVal('highSchool-province'),
      city: getVal('highSchool-city'),
      school: getVal('highSchool-school'),
      startDate: getVal('highSchool-startDate'),
      endDate: getVal('highSchool-endDate'),
      isMain: getRadioVal('highSchool-isMain')
    },
    degreeInfo: {
      degree: getVal('degreeInfo-degree'),
      degreeType: getVal('degreeInfo-degreeType'),
      school: getVal('degreeInfo-school'),
      schoolLocation: getVal('degreeInfo-schoolLocation'),
      college: getVal('degreeInfo-college'),
      majorLevel1: getVal('degreeInfo-majorLevel1'),
      majorLevel2: getVal('degreeInfo-majorLevel2'),
      majorDirection: getVal('degreeInfo-majorDirection'),
      isStudentLeader: getRadioVal('degreeInfo-isStudentLeader')
    },
    relatives: collectEntries('relative-list', ['relation', 'name', 'isEmployee', 'company', 'position']),
    education: collectEntries('education-list', ['school', 'major', 'degree', 'duration', 'isRegular', 'gpa', 'startDate', 'endDate', 'description', 'awards', 'publications']),
    work: collectEntries('work-list', ['company', 'department', 'position', 'type', 'city', 'startDate', 'endDate', 'description']),
    projects: collectEntries('project-list', ['projectName', 'role', 'techStack', 'startDate', 'endDate', 'description']),
    languages: getVal('languages'),
    certificates: getVal('certificates'),
    skills: getVal('skills'),
    jobIntention: {
      position: getVal('intention-position'),
      salary: getVal('intention-salary'),
      city: getVal('intention-city'),
      type: getVal('intention-type'),
      industry: getVal('intention-industry'),
      currentAnnual: getVal('intention-currentAnnual')
    },
    selfEvaluation: getVal('self-evaluation')
  };

  return data;
}

function collectEntries(containerId, keys) {
  const cards = document.querySelectorAll(`#${containerId} .entry-card`);
  const entries = [];

  cards.forEach(card => {
    const entry = {};
    let hasValue = false;

    keys.forEach(key => {
      const els = card.querySelectorAll(`[data-key="${key}"]`);
      if (els.length === 0) return;
      // 单选组：取被选中的那一项
      if (els[0].type === 'radio') {
        const checked = Array.from(els).find(r => r.checked);
        entry[key] = checked ? checked.value : '';
      } else {
        entry[key] = els[0].value.trim();
      }
      if (entry[key]) hasValue = true;
    });

    // 检查"至今"复选框
    const presentCheckbox = card.querySelector('[data-key="isPresent"]');
    if (presentCheckbox && presentCheckbox.checked) {
      entry.endDate = '至今';
      hasValue = true;
    }

    if (hasValue) entries.push(entry);
  });

  return entries;
}

// ===== 自动保存（防抖） =====
let saveTimer = null;
let statusTimer = null;

function saveData() {
  const data = collectFormData();
  chrome.storage.local.set(data, () => {
    showStatus('save-status', '已自动保存 ✓', 'success');
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => showStatus('save-status', '', ''), 1500);
  });
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveData, 800);
}

// 弹窗关闭/隐藏前兜底保存，避免防抖窗口内的数据丢失
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    clearTimeout(saveTimer);
    saveData();
  }
});

function showStatus(id, text, type) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = `status ${type}`;
}

// ===== PDF 导入 =====
async function handlePDFImport(file) {
  showStatus('pdf-status', '正在解析 PDF...', 'loading');

  try {
    // 读取 PDF 文件
    const arrayBuffer = await file.arrayBuffer();

    // 配置 PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = '../lib/pdf.worker.min.js';

    // 加载 PDF
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }

    if (!fullText.trim()) {
      showStatus('pdf-status', 'PDF 内容为空或无法提取文本', 'error');
      return;
    }

    showStatus('pdf-status', '正在调用 AI 解析简历...', 'loading');

    // 发送给 background 调用 LLM 解析
    const response = await chrome.runtime.sendMessage({
      type: 'PARSE_PDF',
      text: fullText
    });

    if (response.error) {
      showStatus('pdf-status', response.error, 'error');
      return;
    }

    // 填充表单
    fillFormFromProfile(response.profile);
    chrome.storage.local.remove('pendingPdfProfile');
    scheduleSave(); // 程序化赋值不触发 input/change，需手动触发自动保存
    showStatus('pdf-status', '解析成功！已自动保存', 'success');
    setTimeout(() => showStatus('pdf-status', '', ''), 4000);
  } catch (err) {
    showStatus('pdf-status', `解析失败: ${err.message}`, 'error');
    console.error('[PDF 解析]', err);
  }
}

// 弹窗重新打开时，应用上次解析期间被关闭的 PDF 结果
function applyPendingPdfProfile() {
  chrome.storage.local.get('pendingPdfProfile', result => {
    if (!result.pendingPdfProfile) return;
    chrome.storage.local.remove('pendingPdfProfile');
    // 扩展弹窗里 window.confirm 不可靠（抢焦点/可能被拦截），用页内确认弹窗
    const modal = document.getElementById('pdf-confirm-modal');
    document.getElementById('pdf-confirm-text').textContent = '检测到上次未完成的 PDF 解析结果，是否应用到表单？';
    modal.style.display = 'flex';
    document.getElementById('pdf-confirm-confirm').onclick = () => {
      modal.style.display = 'none';
      fillFormFromProfile(result.pendingPdfProfile);
      scheduleSave();
      showStatus('save-status', '已应用上次未完成的 PDF 解析结果', 'success');
      setTimeout(() => showStatus('save-status', '', ''), 4000);
    };
    document.getElementById('pdf-confirm-cancel').onclick = () => {
      modal.style.display = 'none';
      showStatus('save-status', '已放弃上次的解析结果', '');
      setTimeout(() => showStatus('save-status', '', ''), 3000);
    };
  });
}

function fillFormFromProfile(profile) {
  if (!profile) return;

  // 基本信息
  if (profile.basic) {
    setVal('basic-name', profile.basic.name);
    setVal('basic-gender', profile.basic.gender);
    setVal('basic-birthday', profile.basic.birthday);
    setVal('basic-phone', profile.basic.phone);
    setVal('basic-email', profile.basic.email);
    setVal('basic-location', profile.basic.location);
    setVal('basic-hukou', profile.basic.hukou);
    setVal('basic-nativePlace', profile.basic.nativePlace);
    setVal('basic-ethnicity', profile.basic.ethnicity);
    setVal('basic-political', profile.basic.political);
    setVal('basic-marital', profile.basic.marital);
    setVal('basic-workYears', profile.basic.workYears);
    setVal('basic-availableDate', profile.basic.availableDate);
    setVal('basic-jobStatus', profile.basic.jobStatus);
    setVal('basic-currentSalary', profile.basic.currentSalary);
    setVal('basic-address', profile.basic.address);
    setVal('basic-website', profile.basic.website);
    setVal('basic-github', profile.basic.github);
    setVal('basic-wechat', profile.basic.wechat);
    setVal('basic-idCard', profile.basic.idCard);
    setVal('basic-height', profile.basic.height);
    setVal('basic-weight', profile.basic.weight);
    setVal('basic-emergencyName', profile.basic.emergencyName);
    setVal('basic-emergencyPhone', profile.basic.emergencyPhone);
  }

  // 其他信息（扩展字段）
  if (profile.extra) {
    setVal('extra-nativeProvince', profile.extra.nativeProvince);
    setVal('extra-nativeCity', profile.extra.nativeCity);
    setVal('extra-nativeDistrict', profile.extra.nativeDistrict);
    setVal('extra-gaokaoProvince', profile.extra.gaokaoProvince);
    setVal('extra-gaokaoCity', profile.extra.gaokaoCity);
    setVal('extra-gaokaoDistrict', profile.extra.gaokaoDistrict);
    setVal('extra-hukouProvince', profile.extra.hukouProvince);
    setVal('extra-hukouCity', profile.extra.hukouCity);
    setVal('extra-hukouDistrict', profile.extra.hukouDistrict);
    setVal('extra-homeProvince', profile.extra.homeProvince);
    setVal('extra-homeCity', profile.extra.homeCity);
    setVal('extra-homeDistrict', profile.extra.homeDistrict);
    setVal('extra-health', profile.extra.health);
  }

  // 学历补充信息
  if (profile.educationExtra) {
    setVal('eduExtra-highestDegree', profile.educationExtra.highestDegree);
    setVal('eduExtra-educationType', profile.educationExtra.educationType);
    setRadioVal('eduExtra-isMain', profile.educationExtra.isMain);
    setRadioVal('eduExtra-hasDoubleDegree', profile.educationExtra.hasDoubleDegree);
    setRadioVal('eduExtra-isUpgraded', profile.educationExtra.isUpgraded);
  }

  // 高中信息
  if (profile.highSchool) {
    fillProvinceSelect('highSchool-province', profile.highSchool.province);
    fillCitySelect('highSchool-city', profile.highSchool.province, profile.highSchool.city);
    setVal('highSchool-school', profile.highSchool.school);
    setVal('highSchool-startDate', profile.highSchool.startDate);
    setVal('highSchool-endDate', profile.highSchool.endDate);
    setRadioVal('highSchool-isMain', profile.highSchool.isMain);
  }

  // 学位与专业信息
  if (profile.degreeInfo) {
    setVal('degreeInfo-degree', profile.degreeInfo.degree);
    setSelectVal('degreeInfo-degreeType', profile.degreeInfo.degreeType);
    setVal('degreeInfo-school', profile.degreeInfo.school);
    setVal('degreeInfo-schoolLocation', profile.degreeInfo.schoolLocation);
    setVal('degreeInfo-college', profile.degreeInfo.college);
    setVal('degreeInfo-majorLevel1', profile.degreeInfo.majorLevel1);
    setVal('degreeInfo-majorLevel2', profile.degreeInfo.majorLevel2);
    setVal('degreeInfo-majorDirection', profile.degreeInfo.majorDirection);
    setRadioVal('degreeInfo-isStudentLeader', profile.degreeInfo.isStudentLeader);
  }

  // 家庭成员 / 亲属
  if (Array.isArray(profile.relatives) && profile.relatives.length > 0) {
    renderRelativeList(profile.relatives);
  }

  // 教育经历
  if (Array.isArray(profile.education) && profile.education.length > 0) {
    renderEducationList(profile.education);
  }

  // 工作经历
  if (Array.isArray(profile.work) && profile.work.length > 0) {
    renderWorkList(profile.work);
  }

  // 项目经历
  if (Array.isArray(profile.projects) && profile.projects.length > 0) {
    renderProjectList(profile.projects);
  }

  // 专业技能
  if (profile.skills) {
    const skillsText = Array.isArray(profile.skills) ? profile.skills.join('\n') : profile.skills;
    setVal('skills', skillsText);
  }

  // 资格证书与语言
  if (profile.languages) {
    const langText = Array.isArray(profile.languages) ? profile.languages.join('\n') : profile.languages;
    setVal('languages', langText);
  }
  if (profile.certificates) {
    const certText = Array.isArray(profile.certificates) ? profile.certificates.join('\n') : profile.certificates;
    setVal('certificates', certText);
  }

  // 求职意向
  if (profile.jobIntention) {
    setVal('intention-position', profile.jobIntention.position);
    setVal('intention-salary', profile.jobIntention.salary);
    setVal('intention-city', profile.jobIntention.city);
    setVal('intention-type', profile.jobIntention.type);
    setVal('intention-industry', profile.jobIntention.industry);
    setVal('intention-currentAnnual', profile.jobIntention.currentAnnual);
  }

  // 自我评价
  if (profile.selfEvaluation) {
    setVal('self-evaluation', profile.selfEvaluation);
  }
}

// ===== JSON 导入/导出 =====
function exportJSON() {
  const data = collectFormData();
  delete data.llm.apiKey;   // 导出文件不含 API Key，避免文件分享泄露密钥
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'resume-autofill-data.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importJSON(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);
    // 导出的文件刻意不含 apiKey：若导入数据缺 Key，补回现有 Key，
    // 避免整块覆盖把已配置的 API Key 清空
    if (data.llm && data.llm.apiKey === undefined) {
      chrome.storage.local.get('llm', result => {
        if (result.llm && result.llm.apiKey) data.llm = { ...data.llm, apiKey: result.llm.apiKey };
        doImport(data);
      });
    } else {
      doImport(data);
    }
  } catch (e) {
    showStatus('save-status', 'JSON 格式错误', 'error');
  }
}

function doImport(data) {
  chrome.storage.local.set(data, () => {
    loadData(); // 重新加载表单
    showStatus('save-status', '导入成功！', 'success');
    setTimeout(() => showStatus('save-status', '', ''), 2000);
  });
}

// ===== 事件绑定 =====
function bindEvents() {
  // 输入/变更自动保存
  document.addEventListener('input', scheduleSave);
  document.addEventListener('change', scheduleSave);

  // 测试 LLM 连接
  document.getElementById('btn-test-llm').addEventListener('click', async () => {
    const btn = document.getElementById('btn-test-llm');
    const statusEl = document.getElementById('llm-test-status');

    const config = {
      baseUrl: getVal('llm-baseUrl'),
      apiKey: getVal('llm-apiKey'),
      model: getVal('llm-model')
    };

    if (!config.baseUrl || !config.apiKey || !config.model) {
      statusEl.textContent = '请先填写 Base URL、API Key 和模型名称';
      statusEl.className = 'status error';
      return;
    }

    btn.disabled = true;
    btn.textContent = '测试中...';
    statusEl.textContent = '';
    statusEl.className = 'status';

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'TEST_LLM',
        config: config
      });

      if (chrome.runtime.lastError) {
        throw new Error(chrome.runtime.lastError.message);
      }

      if (response.error) {
        statusEl.textContent = `❌ ${response.error}`;
        statusEl.className = 'status error';
      } else {
        statusEl.textContent = `✅ 连接成功！模型回复: ${response.reply}`;
        statusEl.className = 'status success';
      }
    } catch (err) {
      statusEl.textContent = `❌ 请求失败: ${err.message}`;
      statusEl.className = 'status error';
    } finally {
      btn.disabled = false;
      btn.textContent = '🔗 测试连接';
    }
  });

  // PDF 导入
  document.getElementById('btn-pdf').addEventListener('click', () => {
    document.getElementById('pdf-input').click();
  });
  document.getElementById('pdf-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handlePDFImport(file);
    e.target.value = ''; // 允许重复选择同一文件
  });

  // 添加教育经历
  document.getElementById('btn-add-edu').addEventListener('click', () => {
    const container = document.getElementById('education-list');
    const index = container.children.length;
    container.appendChild(createEducationCard({}, index));
    scheduleSave();
  });

  // 添加工作经历
  document.getElementById('btn-add-work').addEventListener('click', () => {
    const container = document.getElementById('work-list');
    const index = container.children.length;
    container.appendChild(createWorkCard({}, index));
    scheduleSave();
  });

  // 添加项目经历
  document.getElementById('btn-add-project').addEventListener('click', () => {
    const container = document.getElementById('project-list');
    const index = container.children.length;
    container.appendChild(createProjectCard({}, index));
    scheduleSave();
  });

  // 添加亲属信息
  document.getElementById('btn-add-relative').addEventListener('click', () => {
    const container = document.getElementById('relative-list');
    container.appendChild(createRelativeCard({}, container.children.length));
    scheduleSave();
  });

  // 高中就读院校：省份变化时刷新城市下拉
  document.getElementById('highSchool-province').addEventListener('change', (e) => {
    fillCitySelect('highSchool-city', e.target.value, '');
  });

  // JSON 导出
  document.getElementById('btn-export-json').addEventListener('click', exportJSON);

  // JSON 导入弹窗
  document.getElementById('btn-import-json').addEventListener('click', () => {
    document.getElementById('json-modal').style.display = 'flex';
    document.getElementById('json-input').value = '';
  });
  document.getElementById('btn-json-cancel').addEventListener('click', () => {
    document.getElementById('json-modal').style.display = 'none';
  });
  document.getElementById('btn-json-confirm').addEventListener('click', () => {
    const json = document.getElementById('json-input').value.trim();
    if (json) {
      importJSON(json);
      document.getElementById('json-modal').style.display = 'none';
    }
  });

  // 「至今」复选框事件代理
  document.addEventListener('change', (e) => {
    if (e.target.dataset.key === 'isPresent') {
      const card = e.target.closest('.entry-card');
      const endDateInput = card.querySelector('[data-key="endDate"]');
      if (e.target.checked) {
        endDateInput.value = '';
        endDateInput.disabled = true;
      } else {
        endDateInput.disabled = false;
      }
    }
  });
}

// ===== 工具函数 =====
function esc(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
