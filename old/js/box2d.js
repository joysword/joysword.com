
/* Based on Alex Arnell's inheritance implementation. */
var Class = {
  create: function() {
    var parent = null, properties = $A(arguments);
    if (Object.isFunction(properties[0]))
      parent = properties.shift();

    function klass() {
      this.initialize.apply(this, arguments);
    }

    Object.extend(klass, Class.Methods);
    klass.superclass = parent;
    klass.subclasses = [];

    if (parent) {
      var subclass = function() { };
      subclass.prototype = parent.prototype;
      klass.prototype = new subclass;
      parent.subclasses.push(klass);
    }

    for (var i = 0; i < properties.length; i++)
      klass.addMethods(properties[i]);

    if (!klass.prototype.initialize)
      klass.prototype.initialize = this.emptyFunction;

    klass.prototype.constructor = klass;

    return klass;
  },
  emptyFunction:function () {}

};

Class.Methods = {
  addMethods: function(source) {
    var ancestor   = this.superclass && this.superclass.prototype;
    var properties = Object.keys(source);

    if (!Object.keys({ toString: true }).length)
      properties.push("toString", "valueOf");

    for (var i = 0, length = properties.length; i < length; i++) {
      var property = properties[i], value = source[property];
      if (ancestor && Object.isFunction(value) &&
          value.argumentNames().first() == "$super") {
        var method = value, value = Object.extend((function(m) {
          return function() { return ancestor[m].apply(this, arguments) };
        })(property).wrap(method), {
          valueOf:  function() { return method },
          toString: function() { return method.toString() }
        });
      }
      this.prototype[property] = value;
    }

    return this;
  }
};

Object.extend = function(destination, source) {
  for (var property in source)
    destination[property] = source[property];
  return destination;
};

Object.extend(Object, {
  inspect: function(object) {
    try {
      if (Object.isUndefined(object)) return 'undefined';
      if (object === null) return 'null';
      return object.inspect ? object.inspect() : String(object);
    } catch (e) {
      if (e instanceof RangeError) return '...';
      throw e;
    }
  },

  toJSON: function(object) {
    var type = typeof object;
    switch (type) {
      case 'undefined':
      case 'function':
      case 'unknown': return;
      case 'boolean': return object.toString();
    }

    if (object === null) return 'null';
    if (object.toJSON) return object.toJSON();
    if (Object.isElement(object)) return;

    var results = [];
    for (var property in object) {
      var value = Object.toJSON(object[property]);
      if (!Object.isUndefined(value))
        results.push(property.toJSON() + ': ' + value);
    }

    return '{' + results.join(', ') + '}';
  },

  toQueryString: function(object) {
    return $H(object).toQueryString();
  },

  toHTML: function(object) {
    return object && object.toHTML ? object.toHTML() : String.interpret(object);
  },

  keys: function(object) {
    var keys = [];
    for (var property in object)
      keys.push(property);
    return keys;
  },

  values: function(object) {
    var values = [];
    for (var property in object)
      values.push(object[property]);
    return values;
  },

  clone: function(object) {
    return Object.extend({ }, object);
  },

  isElement: function(object) {
    return object && object.nodeType == 1;
  },

  isArray: function(object) {
    return object != null && typeof object == "object" &&
      'splice' in object && 'join' in object;
  },

  isHash: function(object) {
    return object instanceof Hash;
  },

  isFunction: function(object) {
    return typeof object == "function";
  },

  isString: function(object) {
    return typeof object == "string";
  },

  isNumber: function(object) {
    return typeof object == "number";
  },

  isUndefined: function(object) {
    return typeof object == "undefined";
  }
});

function $A(iterable) {
  if (!iterable) return [];
  if (iterable.toArray) return iterable.toArray();
  var length = iterable.length || 0, results = new Array(length);
  while (length--) results[length] = iterable[length];
  return results;
}

if (WebKit = navigator.userAgent.indexOf('AppleWebKit/') > -1) {
  $A = function(iterable) {
    if (!iterable) return [];
    if (!(Object.isFunction(iterable) && iterable == '[object NodeList]') &&
        iterable.toArray) return iterable.toArray();
    var length = iterable.length || 0, results = new Array(length);
    while (length--) results[length] = iterable[length];
    return results;
  };
}
/*
 * Box2Djs (port of Box2DFlash 1.4.3.1) - http://box2d-js.sourceforge.net/
 * Single-filed and jsmined ( http://code.google.com/p/jsmin-php/ ) by Mr.doob
 */
锘�
var b2Settings=Class.create();b2Settings.prototype={initialize:function(){}}
b2Settings.USHRT_MAX=0x0000ffff;b2Settings.b2_pi=Math.PI;b2Settings.b2_massUnitsPerKilogram=1.0;b2Settings.b2_timeUnitsPerSecond=1.0;b2Settings.b2_lengthUnitsPerMeter=30.0;b2Settings.b2_maxManifoldPoints=2;b2Settings.b2_maxShapesPerBody=64;b2Settings.b2_maxPolyVertices=8;b2Settings.b2_maxProxies=1024;b2Settings.b2_maxPairs=8*b2Settings.b2_maxProxies;b2Settings.b2_linearSlop=0.005*b2Settings.b2_lengthUnitsPerMeter;b2Settings.b2_angularSlop=2.0/180.0*b2Settings.b2_pi;b2Settings.b2_velocityThreshold=1.0*b2Settings.b2_lengthUnitsPerMeter/b2Settings.b2_timeUnitsPerSecond;b2Settings.b2_maxLinearCorrection=0.2*b2Settings.b2_lengthUnitsPerMeter;b2Settings.b2_maxAngularCorrection=8.0/180.0*b2Settings.b2_pi;b2Settings.b2_contactBaumgarte=0.2;b2Settings.b2_timeToSleep=0.5*b2Settings.b2_timeUnitsPerSecond;b2Settings.b2_linearSleepTolerance=0.01*b2Settings.b2_lengthUnitsPerMeter/b2Settings.b2_timeUnitsPerSecond;b2Settings.b2_angularSleepTolerance=2.0/180.0/b2Settings.b2_timeUnitsPerSecond;b2Settings.b2Assert=function(a)
{if(!a){var nullVec;nullVec.x++;}};
var b2Vec2=Class.create();b2Vec2.prototype={initialize:function(x_,y_){this.x=x_;this.y=y_;},SetZero:function(){this.x=0.0;this.y=0.0;},Set:function(x_,y_){this.x=x_;this.y=y_;},SetV:function(v){this.x=v.x;this.y=v.y;},Negative:function(){return new b2Vec2(-this.x,-this.y);},Copy:function(){return new b2Vec2(this.x,this.y);},Add:function(v)
{this.x+=v.x;this.y+=v.y;},Subtract:function(v)
{this.x-=v.x;this.y-=v.y;},Multiply:function(a)
{this.x*=a;this.y*=a;},MulM:function(A)
{var tX=this.x;this.x=A.col1.x*tX+A.col2.x*this.y;this.y=A.col1.y*tX+A.col2.y*this.y;},MulTM:function(A)
{var tX=b2Math.b2Dot(this,A.col1);this.y=b2Math.b2Dot(this,A.col2);this.x=tX;},CrossVF:function(s)
{var tX=this.x;this.x=s*this.y;this.y=-s*tX;},CrossFV:function(s)
{var tX=this.x;this.x=-s*this.y;this.y=s*tX;},MinV:function(b)
{this.x=this.x<b.x?this.x:b.x;this.y=this.y<b.y?this.y:b.y;},MaxV:function(b)
{this.x=this.x>b.x?this.x:b.x;this.y=this.y>b.y?this.y:b.y;},Abs:function()
{this.x=Math.abs(this.x);this.y=Math.abs(this.y);},Length:function()
{return Math.sqrt(this.x*this.x+this.y*this.y);},Normalize:function()
{var length=this.Length();if(length<Number.MIN_VALUE)
{return 0.0;}
var invLength=1.0/length;this.x*=invLength;this.y*=invLength;return length;},IsValid:function()
{return b2Math.b2IsValid(this.x)&&b2Math.b2IsValid(this.y);},x:null,y:null};b2Vec2.Make=function(x_,y_)
{return new b2Vec2(x_,y_);};
var b2Mat22=Class.create();b2Mat22.prototype={initialize:function(angle,c1,c2)
{if(angle==null)angle=0;this.col1=new b2Vec2();this.col2=new b2Vec2();if(c1!=null&&c2!=null){this.col1.SetV(c1);this.col2.SetV(c2);}
else{var c=Math.cos(angle);var s=Math.sin(angle);this.col1.x=c;this.col2.x=-s;this.col1.y=s;this.col2.y=c;}},Set:function(angle)
{var c=Math.cos(angle);var s=Math.sin(angle);this.col1.x=c;this.col2.x=-s;this.col1.y=s;this.col2.y=c;},SetVV:function(c1,c2)
{this.col1.SetV(c1);this.col2.SetV(c2);},Copy:function(){return new b2Mat22(0,this.col1,this.col2);},SetM:function(m)
{this.col1.SetV(m.col1);this.col2.SetV(m.col2);},AddM:function(m)
{this.col1.x+=m.col1.x;this.col1.y+=m.col1.y;this.col2.x+=m.col2.x;this.col2.y+=m.col2.y;},SetIdentity:function()
{this.col1.x=1.0;this.col2.x=0.0;this.col1.y=0.0;this.col2.y=1.0;},SetZero:function()
{this.col1.x=0.0;this.col2.x=0.0;this.col1.y=0.0;this.col2.y=0.0;},Invert:function(out)
{var a=this.col1.x;var b=this.col2.x;var c=this.col1.y;var d=this.col2.y;var det=a*d-b*c;det=1.0/det;out.col1.x=det*d;out.col2.x=-det*b;out.col1.y=-det*c;out.col2.y=det*a;return out;},Solve:function(out,bX,bY)
{var a11=this.col1.x;var a12=this.col2.x;var a21=this.col1.y;var a22=this.col2.y;var det=a11*a22-a12*a21;det=1.0/det;out.x=det*(a22*bX-a12*bY);out.y=det*(a11*bY-a21*bX);return out;},Abs:function()
{this.col1.Abs();this.col2.Abs();},col1:new b2Vec2(),col2:new b2Vec2()};
var b2Math=Class.create();b2Math.prototype={initialize:function(){}}
b2Math.b2IsValid=function(x)
{return isFinite(x);};b2Math.b2Dot=function(a,b)
{return a.x*b.x+a.y*b.y;};b2Math.b2CrossVV=function(a,b)
{return a.x*b.y-a.y*b.x;};b2Math.b2CrossVF=function(a,s)
{var v=new b2Vec2(s*a.y,-s*a.x);return v;};b2Math.b2CrossFV=function(s,a)
{var v=new b2Vec2(-s*a.y,s*a.x);return v;};b2Math.b2MulMV=function(A,v)
{var u=new b2Vec2(A.col1.x*v.x+A.col2.x*v.y,A.col1.y*v.x+A.col2.y*v.y);return u;};b2Math.b2MulTMV=function(A,v)
{var u=new b2Vec2(b2Math.b2Dot(v,A.col1),b2Math.b2Dot(v,A.col2));return u;};b2Math.AddVV=function(a,b)
{var v=new b2Vec2(a.x+b.x,a.y+b.y);return v;};b2Math.SubtractVV=function(a,b)
{var v=new b2Vec2(a.x-b.x,a.y-b.y);return v;};b2Math.MulFV=function(s,a)
{var v=new b2Vec2(s*a.x,s*a.y);return v;};b2Math.AddMM=function(A,B)
{var C=new b2Mat22(0,b2Math.AddVV(A.col1,B.col1),b2Math.AddVV(A.col2,B.col2));return C;};b2Math.b2MulMM=function(A,B)
{var C=new b2Mat22(0,b2Math.b2MulMV(A,B.col1),b2Math.b2MulMV(A,B.col2));return C;};b2Math.b2MulTMM=function(A,B)
{var c1=new b2Vec2(b2Math.b2Dot(A.col1,B.col1),b2Math.b2Dot(A.col2,B.col1));var c2=new b2Vec2(b2Math.b2Dot(A.col1,B.col2),b2Math.b2Dot(A.col2,B.col2));var C=new b2Mat22(0,c1,c2);return C;};b2Math.b2Abs=function(a)
{return a>0.0?a:-a;};b2Math.b2AbsV=function(a)
{var b=new b2Vec2(b2Math.b2Abs(a.x),b2Math.b2Abs(a.y));return b;};b2Math.b2AbsM=function(A)
{var B=new b2Mat22(0,b2Math.b2AbsV(A.col1),b2Math.b2AbsV(A.col2));return B;};b2Math.b2Min=function(a,b)
{return a<b?a:b;};b2Math.b2MinV=function(a,b)
{var c=new b2Vec2(b2Math.b2Min(a.x,b.x),b2Math.b2Min(a.y,b.y));return c;};b2Math.b2Max=function(a,b)
{return a>b?a:b;};b2Math.b2MaxV=function(a,b)
{var c=new b2Vec2(b2Math.b2Max(a.x,b.x),b2Math.b2Max(a.y,b.y));return c;};b2Math.b2Clamp=function(a,low,high)
{return b2Math.b2Max(low,b2Math.b2Min(a,high));};b2Math.b2ClampV=function(a,low,high)
{return b2Math.b2MaxV(low,b2Math.b2MinV(a,high));};b2Math.b2Swap=function(a,b)
{var tmp=a[0];a[0]=b[0];b[0]=tmp;};b2Math.b2Random=function()
{return Math.random()*2-1;};b2Math.b2NextPowerOfTwo=function(x)
{x|=(x>>1)&0x7FFFFFFF;x|=(x>>2)&0x3FFFFFFF;x|=(x>>4)&0x0FFFFFFF;x|=(x>>8)&0x00FFFFFF;x|=(x>>16)&0x0000FFFF;return x+1;};b2Math.b2IsPowerOfTwo=function(x)
{var result=x>0&&(x&(x-1))==0;return result;};b2Math.tempVec2=new b2Vec2();b2Math.tempVec3=new b2Vec2();b2Math.tempVec4=new b2Vec2();b2Math.tempVec5=new b2Vec2();b2Math.tempMat=new b2Mat22();
var b2AABB=Class.create();b2AABB.prototype={IsValid:function(){var dX=this.maxVertex.x;var dY=this.maxVertex.y;dX=this.maxVertex.x;dY=this.maxVertex.y;dX-=this.minVertex.x;dY-=this.minVertex.y;var valid=dX>=0.0&&dY>=0.0;valid=valid&&this.minVertex.IsValid()&&this.maxVertex.IsValid();return valid;},minVertex:new b2Vec2(),maxVertex:new b2Vec2(),initialize:function(){this.minVertex=new b2Vec2();this.maxVertex=new b2Vec2();}};
var b2Bound=Class.create();b2Bound.prototype={IsLower:function(){return(this.value&1)==0;},IsUpper:function(){return(this.value&1)==1;},Swap:function(b){var tempValue=this.value;var tempProxyId=this.proxyId;var tempStabbingCount=this.stabbingCount;this.value=b.value;this.proxyId=b.proxyId;this.stabbingCount=b.stabbingCount;b.value=tempValue;b.proxyId=tempProxyId;b.stabbingCount=tempStabbingCount;},value:0,proxyId:0,stabbingCount:0,initialize:function(){}}
var b2BoundValues=Class.create();b2BoundValues.prototype={lowerValues:[0,0],upperValues:[0,0],initialize:function(){this.lowerValues=[0,0];this.upperValues=[0,0];}}
var b2Pair=Class.create();b2Pair.prototype={SetBuffered:function(){this.status|=b2Pair.e_pairBuffered;},ClearBuffered:function(){this.status&=~b2Pair.e_pairBuffered;},IsBuffered:function(){return(this.status&b2Pair.e_pairBuffered)==b2Pair.e_pairBuffered;},SetRemoved:function(){this.status|=b2Pair.e_pairRemoved;},ClearRemoved:function(){this.status&=~b2Pair.e_pairRemoved;},IsRemoved:function(){return(this.status&b2Pair.e_pairRemoved)==b2Pair.e_pairRemoved;},SetFinal:function(){this.status|=b2Pair.e_pairFinal;},IsFinal:function(){return(this.status&b2Pair.e_pairFinal)==b2Pair.e_pairFinal;},userData:null,proxyId1:0,proxyId2:0,next:0,status:0,initialize:function(){}};b2Pair.b2_nullPair=b2Settings.USHRT_MAX;b2Pair.b2_nullProxy=b2Settings.USHRT_MAX;b2Pair.b2_tableCapacity=b2Settings.b2_maxPairs;b2Pair.b2_tableMask=b2Pair.b2_tableCapacity-1;b2Pair.e_pairBuffered=0x0001;b2Pair.e_pairRemoved=0x0002;b2Pair.e_pairFinal=0x0004;
var b2PairCallback=Class.create();b2PairCallback.prototype={PairAdded:function(proxyUserData1,proxyUserData2){return null},PairRemoved:function(proxyUserData1,proxyUserData2,pairUserData){},initialize:function(){}};
var b2BufferedPair=Class.create();b2BufferedPair.prototype={proxyId1:0,proxyId2:0,initialize:function(){}}
var b2PairManager=Class.create();b2PairManager.prototype={initialize:function(){var i=0;this.m_hashTable=new Array(b2Pair.b2_tableCapacity);for(i=0;i<b2Pair.b2_tableCapacity;++i)
{this.m_hashTable[i]=b2Pair.b2_nullPair;}
this.m_pairs=new Array(b2Settings.b2_maxPairs);for(i=0;i<b2Settings.b2_maxPairs;++i)
{this.m_pairs[i]=new b2Pair();}
this.m_pairBuffer=new Array(b2Settings.b2_maxPairs);for(i=0;i<b2Settings.b2_maxPairs;++i)
{this.m_pairBuffer[i]=new b2BufferedPair();}
for(i=0;i<b2Settings.b2_maxPairs;++i)
{this.m_pairs[i].proxyId1=b2Pair.b2_nullProxy;this.m_pairs[i].proxyId2=b2Pair.b2_nullProxy;this.m_pairs[i].userData=null;this.m_pairs[i].status=0;this.m_pairs[i].next=(i+1);}
this.m_pairs[b2Settings.b2_maxPairs-1].next=b2Pair.b2_nullPair;this.m_pairCount=0;},Initialize:function(broadPhase,callback){this.m_broadPhase=broadPhase;this.m_callback=callback;},AddBufferedPair:function(proxyId1,proxyId2){var pair=this.AddPair(proxyId1,proxyId2);if(pair.IsBuffered()==false)
{pair.SetBuffered();this.m_pairBuffer[this.m_pairBufferCount].proxyId1=pair.proxyId1;this.m_pairBuffer[this.m_pairBufferCount].proxyId2=pair.proxyId2;++this.m_pairBufferCount;}
pair.ClearRemoved();if(b2BroadPhase.s_validate)
{this.ValidateBuffer();}},RemoveBufferedPair:function(proxyId1,proxyId2){var pair=this.Find(proxyId1,proxyId2);if(pair==null)
{return;}
if(pair.IsBuffered()==false)
{pair.SetBuffered();this.m_pairBuffer[this.m_pairBufferCount].proxyId1=pair.proxyId1;this.m_pairBuffer[this.m_pairBufferCount].proxyId2=pair.proxyId2;++this.m_pairBufferCount;}
pair.SetRemoved();if(b2BroadPhase.s_validate)
{this.ValidateBuffer();}},Commit:function(){var i=0;var removeCount=0;var proxies=this.m_broadPhase.m_proxyPool;for(i=0;i<this.m_pairBufferCount;++i)
{var pair=this.Find(this.m_pairBuffer[i].proxyId1,this.m_pairBuffer[i].proxyId2);pair.ClearBuffered();var proxy1=proxies[pair.proxyId1];var proxy2=proxies[pair.proxyId2];if(pair.IsRemoved())
{if(pair.IsFinal()==true)
{this.m_callback.PairRemoved(proxy1.userData,proxy2.userData,pair.userData);}
this.m_pairBuffer[removeCount].proxyId1=pair.proxyId1;this.m_pairBuffer[removeCount].proxyId2=pair.proxyId2;++removeCount;}
else
{if(pair.IsFinal()==false)
{pair.userData=this.m_callback.PairAdded(proxy1.userData,proxy2.userData);pair.SetFinal();}}}
for(i=0;i<removeCount;++i)
{this.RemovePair(this.m_pairBuffer[i].proxyId1,this.m_pairBuffer[i].proxyId2);}
this.m_pairBufferCount=0;if(b2BroadPhase.s_validate)
{this.ValidateTable();}},AddPair:function(proxyId1,proxyId2){if(proxyId1>proxyId2){var temp=proxyId1;proxyId1=proxyId2;proxyId2=temp;}
var hash=b2PairManager.Hash(proxyId1,proxyId2)&b2Pair.b2_tableMask;var pair=pair=this.FindHash(proxyId1,proxyId2,hash);if(pair!=null)
{return pair;}
var pIndex=this.m_freePair;pair=this.m_pairs[pIndex];this.m_freePair=pair.next;pair.proxyId1=proxyId1;pair.proxyId2=proxyId2;pair.status=0;pair.userData=null;pair.next=this.m_hashTable[hash];this.m_hashTable[hash]=pIndex;++this.m_pairCount;return pair;},RemovePair:function(proxyId1,proxyId2){if(proxyId1>proxyId2){var temp=proxyId1;proxyId1=proxyId2;proxyId2=temp;}
var hash=b2PairManager.Hash(proxyId1,proxyId2)&b2Pair.b2_tableMask;var node=this.m_hashTable[hash];var pNode=null;while(node!=b2Pair.b2_nullPair)
{if(b2PairManager.Equals(this.m_pairs[node],proxyId1,proxyId2))
{var index=node;if(pNode){pNode.next=this.m_pairs[node].next;}
else{this.m_hashTable[hash]=this.m_pairs[node].next;}
var pair=this.m_pairs[index];var userData=pair.userData;pair.next=this.m_freePair;pair.proxyId1=b2Pair.b2_nullProxy;pair.proxyId2=b2Pair.b2_nullProxy;pair.userData=null;pair.status=0;this.m_freePair=index;--this.m_pairCount;return userData;}
else
{pNode=this.m_pairs[node];node=pNode.next;}}
return null;},Find:function(proxyId1,proxyId2){if(proxyId1>proxyId2){var temp=proxyId1;proxyId1=proxyId2;proxyId2=temp;}
var hash=b2PairManager.Hash(proxyId1,proxyId2)&b2Pair.b2_tableMask;return this.FindHash(proxyId1,proxyId2,hash);},FindHash:function(proxyId1,proxyId2,hash){var index=this.m_hashTable[hash];while(index!=b2Pair.b2_nullPair&&b2PairManager.Equals(this.m_pairs[index],proxyId1,proxyId2)==false)
{index=this.m_pairs[index].next;}
if(index==b2Pair.b2_nullPair)
{return null;}
return this.m_pairs[index];},ValidateBuffer:function(){},ValidateTable:function(){},m_broadPhase:null,m_callback:null,m_pairs:null,m_freePair:0,m_pairCount:0,m_pairBuffer:null,m_pairBufferCount:0,m_hashTable:null};b2PairManager.Hash=function(proxyId1,proxyId2)
{var key=((proxyId2<<16)&0xffff0000)|proxyId1;key=~key+((key<<15)&0xFFFF8000);key=key^((key>>12)&0x000fffff);key=key+((key<<2)&0xFFFFFFFC);key=key^((key>>4)&0x0fffffff);key=key*2057;key=key^((key>>16)&0x0000ffff);return key;};b2PairManager.Equals=function(pair,proxyId1,proxyId2)
{return(pair.proxyId1==proxyId1&&pair.proxyId2==proxyId2);};b2PairManager.EqualsPair=function(pair1,pair2)
{return pair1.proxyId1==pair2.proxyId1&&pair1.proxyId2==pair2.proxyId2;};
var b2BroadPhase=Class.create();b2BroadPhase.prototype={initialize:function(worldAABB,callback){this.m_pairManager=new b2PairManager();this.m_proxyPool=new Array(b2Settings.b2_maxPairs);this.m_bounds=new Array(2*b2Settings.b2_maxProxies);this.m_queryResults=new Array(b2Settings.b2_maxProxies);this.m_quantizationFactor=new b2Vec2();var i=0;this.m_pairManager.Initialize(this,callback);this.m_worldAABB=worldAABB;this.m_proxyCount=0;for(i=0;i<b2Settings.b2_maxProxies;i++){this.m_queryResults[i]=0;}
this.m_bounds=new Array(2);for(i=0;i<2;i++){this.m_bounds[i]=new Array(2*b2Settings.b2_maxProxies);for(var j=0;j<2*b2Settings.b2_maxProxies;j++){this.m_bounds[i][j]=new b2Bound();}}
var dX=worldAABB.maxVertex.x;var dY=worldAABB.maxVertex.y;dX-=worldAABB.minVertex.x;dY-=worldAABB.minVertex.y;this.m_quantizationFactor.x=b2Settings.USHRT_MAX/dX;this.m_quantizationFactor.y=b2Settings.USHRT_MAX/dY;var tProxy;for(i=0;i<b2Settings.b2_maxProxies-1;++i)
{tProxy=new b2Proxy();this.m_proxyPool[i]=tProxy;tProxy.SetNext(i+1);tProxy.timeStamp=0;tProxy.overlapCount=b2BroadPhase.b2_invalid;tProxy.userData=null;}
tProxy=new b2Proxy();this.m_proxyPool[b2Settings.b2_maxProxies-1]=tProxy;tProxy.SetNext(b2Pair.b2_nullProxy);tProxy.timeStamp=0;tProxy.overlapCount=b2BroadPhase.b2_invalid;tProxy.userData=null;this.m_freeProxy=0;this.m_timeStamp=1;this.m_queryResultCount=0;},InRange:function(aabb){var dX;var dY;var d2X;var d2Y;dX=aabb.minVertex.x;dY=aabb.minVertex.y;dX-=this.m_worldAABB.maxVertex.x;dY-=this.m_worldAABB.maxVertex.y;d2X=this.m_worldAABB.minVertex.x;d2Y=this.m_worldAABB.minVertex.y;d2X-=aabb.maxVertex.x;d2Y-=aabb.maxVertex.y;dX=b2Math.b2Max(dX,d2X);dY=b2Math.b2Max(dY,d2Y);return b2Math.b2Max(dX,dY)<0.0;},GetProxy:function(proxyId){if(proxyId==b2Pair.b2_nullProxy||this.m_proxyPool[proxyId].IsValid()==false)
{return null;}
return this.m_proxyPool[proxyId];},CreateProxy:function(aabb,userData){var index=0;var proxy;var proxyId=this.m_freeProxy;proxy=this.m_proxyPool[proxyId];this.m_freeProxy=proxy.GetNext();proxy.overlapCount=0;proxy.userData=userData;var boundCount=2*this.m_proxyCount;var lowerValues=new Array();var upperValues=new Array();this.ComputeBounds(lowerValues,upperValues,aabb);for(var axis=0;axis<2;++axis)
{var bounds=this.m_bounds[axis];var lowerIndex=0;var upperIndex=0;var lowerIndexOut=[lowerIndex];var upperIndexOut=[upperIndex];this.Query(lowerIndexOut,upperIndexOut,lowerValues[axis],upperValues[axis],bounds,boundCount,axis);lowerIndex=lowerIndexOut[0];upperIndex=upperIndexOut[0];var tArr=new Array();var j=0;var tEnd=boundCount-upperIndex
var tBound1;var tBound2;for(j=0;j<tEnd;j++){tArr[j]=new b2Bound();tBound1=tArr[j];tBound2=bounds[upperIndex+j];tBound1.value=tBound2.value;tBound1.proxyId=tBound2.proxyId;tBound1.stabbingCount=tBound2.stabbingCount;}
tEnd=tArr.length;var tIndex=upperIndex+2;for(j=0;j<tEnd;j++){tBound2=tArr[j];tBound1=bounds[tIndex+j]
tBound1.value=tBound2.value;tBound1.proxyId=tBound2.proxyId;tBound1.stabbingCount=tBound2.stabbingCount;}
tArr=new Array();tEnd=upperIndex-lowerIndex;for(j=0;j<tEnd;j++){tArr[j]=new b2Bound();tBound1=tArr[j];tBound2=bounds[lowerIndex+j];tBound1.value=tBound2.value;tBound1.proxyId=tBound2.proxyId;tBound1.stabbingCount=tBound2.stabbingCount;}
tEnd=tArr.length;tIndex=lowerIndex+1;for(j=0;j<tEnd;j++){tBound2=tArr[j];tBound1=bounds[tIndex+j]
tBound1.value=tBound2.value;tBound1.proxyId=tBound2.proxyId;tBound1.stabbingCount=tBound2.stabbingCount;}
++upperIndex;bounds[lowerIndex].value=lowerValues[axis];bounds[lowerIndex].proxyId=proxyId;bounds[upperIndex].value=upperValues[axis];bounds[upperIndex].proxyId=proxyId;bounds[lowerIndex].stabbingCount=lowerIndex==0?0:bounds[lowerIndex-1].stabbingCount;bounds[upperIndex].stabbingCount=bounds[upperIndex-1].stabbingCount;for(index=lowerIndex;index<upperIndex;++index)
{bounds[index].stabbingCount++;}
for(index=lowerIndex;index<boundCount+2;++index)
{var proxy2=this.m_proxyPool[bounds[index].proxyId];if(bounds[index].IsLower())
{proxy2.lowerBounds[axis]=index;}
else
{proxy2.upperBounds[axis]=index;}}}
++this.m_proxyCount;for(var i=0;i<this.m_queryResultCount;++i)
{this.m_pairManager.AddBufferedPair(proxyId,this.m_queryResults[i]);}
this.m_pairManager.Commit();this.m_queryResultCount=0;this.IncrementTimeStamp();return proxyId;},DestroyProxy:function(proxyId){var proxy=this.m_proxyPool[proxyId];var boundCount=2*this.m_proxyCount;for(var axis=0;axis<2;++axis)
{var bounds=this.m_bounds[axis];var lowerIndex=proxy.lowerBounds[axis];var upperIndex=proxy.upperBounds[axis];var lowerValue=bounds[lowerIndex].value;var upperValue=bounds[upperIndex].value;var tArr=new Array();var j=0;var tEnd=upperIndex-lowerIndex-1;var tBound1;var tBound2;for(j=0;j<tEnd;j++){tArr[j]=new b2Bound();tBound1=tArr[j];tBound2=bounds[lowerIndex+1+j];tBound1.value=tBound2.value;tBound1.proxyId=tBound2.proxyId;tBound1.stabbingCount=tBound2.stabbingCount;}
tEnd=tArr.length;var tIndex=lowerIndex;for(j=0;j<tEnd;j++){tBound2=tArr[j];tBound1=bounds[tIndex+j]
tBound1.value=tBound2.value;tBound1.proxyId=tBound2.proxyId;tBound1.stabbingCount=tBound2.stabbingCount;}
tArr=new Array();tEnd=boundCount-upperIndex-1;for(j=0;j<tEnd;j++){tArr[j]=new b2Bound();tBound1=tArr[j];tBound2=bounds[upperIndex+1+j];tBound1.value=tBound2.value;tBound1.proxyId=tBound2.proxyId;tBound1.stabbingCount=tBound2.stabbingCount;}
tEnd=tArr.length;tIndex=upperIndex-1;for(j=0;j<tEnd;j++){tBound2=tArr[j];tBound1=bounds[tIndex+j]
tBound1.value=tBound2.value;tBound1.proxyId=tBound2.proxyId;tBound1.stabbingCount=tBound2.stabbingCount;}
tEnd=boundCount-2;for(var index=lowerIndex;index<tEnd;++index)
{var proxy2=this.m_proxyPool[bounds[index].proxyId];if(bounds[index].IsLower())
{proxy2.lowerBounds[axis]=index;}
else
{proxy2.upperBounds[axis]=index;}}
tEnd=upperIndex-1;for(var index2=lowerIndex;index2<tEnd;++index2)
{bounds[index2].stabbingCount--;}
this.Query([0],[0],lowerValue,upperValue,bounds,boundCount-2,axis);}
for(var i=0;i<this.m_queryResultCount;++i)
{this.m_pairManager.RemoveBufferedPair(proxyId,this.m_queryResults[i]);}
this.m_pairManager.Commit();this.m_queryResultCount=0;this.IncrementTimeStamp();proxy.userData=null;proxy.overlapCount=b2BroadPhase.b2_invalid;proxy.lowerBounds[0]=b2BroadPhase.b2_invalid;proxy.lowerBounds[1]=b2BroadPhase.b2_invalid;proxy.upperBounds[0]=b2BroadPhase.b2_invalid;proxy.upperBounds[1]=b2BroadPhase.b2_invalid;proxy.SetNext(this.m_freeProxy);this.m_freeProxy=proxyId;--this.m_proxyCount;},MoveProxy:function(proxyId,aabb){var axis=0;var index=0;var bound;var prevBound
var nextBound
var nextProxyId=0;var nextProxy;if(proxyId==b2Pair.b2_nullProxy||b2Settings.b2_maxProxies<=proxyId)
{return;}
if(aabb.IsValid()==false)
{return;}
var boundCount=2*this.m_proxyCount;var proxy=this.m_proxyPool[proxyId];var newValues=new b2BoundValues();this.ComputeBounds(newValues.lowerValues,newValues.upperValues,aabb);var oldValues=new b2BoundValues();for(axis=0;axis<2;++axis)
{oldValues.lowerValues[axis]=this.m_bounds[axis][proxy.lowerBounds[axis]].value;oldValues.upperValues[axis]=this.m_bounds[axis][proxy.upperBounds[axis]].value;}
for(axis=0;axis<2;++axis)
{var bounds=this.m_bounds[axis];var lowerIndex=proxy.lowerBounds[axis];var upperIndex=proxy.upperBounds[axis];var lowerValue=newValues.lowerValues[axis];var upperValue=newValues.upperValues[axis];var deltaLower=lowerValue-bounds[lowerIndex].value;var deltaUpper=upperValue-bounds[upperIndex].value;bounds[lowerIndex].value=lowerValue;bounds[upperIndex].value=upperValue;if(deltaLower<0)
{index=lowerIndex;while(index>0&&lowerValue<bounds[index-1].value)
{bound=bounds[index];prevBound=bounds[index-1];var prevProxyId=prevBound.proxyId;var prevProxy=this.m_proxyPool[prevBound.proxyId];prevBound.stabbingCount++;if(prevBound.IsUpper()==true)
{if(this.TestOverlap(newValues,prevProxy))
{this.m_pairManager.AddBufferedPair(proxyId,prevProxyId);}
prevProxy.upperBounds[axis]++;bound.stabbingCount++;}
else
{prevProxy.lowerBounds[axis]++;bound.stabbingCount--;}
proxy.lowerBounds[axis]--;bound.Swap(prevBound);--index;}}
if(deltaUpper>0)
{index=upperIndex;while(index<boundCount-1&&bounds[index+1].value<=upperValue)
{bound=bounds[index];nextBound=bounds[index+1];nextProxyId=nextBound.proxyId;nextProxy=this.m_proxyPool[nextProxyId];nextBound.stabbingCount++;if(nextBound.IsLower()==true)
{if(this.TestOverlap(newValues,nextProxy))
{this.m_pairManager.AddBufferedPair(proxyId,nextProxyId);}
nextProxy.lowerBounds[axis]--;bound.stabbingCount++;}
else
{nextProxy.upperBounds[axis]--;bound.stabbingCount--;}
proxy.upperBounds[axis]++;bound.Swap(nextBound);index++;}}
if(deltaLower>0)
{index=lowerIndex;while(index<boundCount-1&&bounds[index+1].value<=lowerValue)
{bound=bounds[index];nextBound=bounds[index+1];nextProxyId=nextBound.proxyId;nextProxy=this.m_proxyPool[nextProxyId];nextBound.stabbingCount--;if(nextBound.IsUpper())
{if(this.TestOverlap(oldValues,nextProxy))
{this.m_pairManager.RemoveBufferedPair(proxyId,nextProxyId);}
nextProxy.upperBounds[axis]--;bound.stabbingCount--;}
else
{nextProxy.lowerBounds[axis]--;bound.stabbingCount++;}
proxy.lowerBounds[axis]++;bound.Swap(nextBound);index++;}}
if(deltaUpper<0)
{index=upperIndex;while(index>0&&upperValue<bounds[index-1].value)
{bound=bounds[index];prevBound=bounds[index-1];prevProxyId=prevBound.proxyId;prevProxy=this.m_proxyPool[prevProxyId];prevBound.stabbingCount--;if(prevBound.IsLower()==true)
{if(this.TestOverlap(oldValues,prevProxy))
{this.m_pairManager.RemoveBufferedPair(proxyId,prevProxyId);}
prevProxy.lowerBounds[axis]++;bound.stabbingCount--;}
else
{prevProxy.upperBounds[axis]++;bound.stabbingCount++;}
proxy.upperBounds[axis]--;bound.Swap(prevBound);index--;}}}},Commit:function(){this.m_pairManager.Commit();},QueryAABB:function(aabb,userData,maxCount){var lowerValues=new Array();var upperValues=new Array();this.ComputeBounds(lowerValues,upperValues,aabb);var lowerIndex=0;var upperIndex=0;var lowerIndexOut=[lowerIndex];var upperIndexOut=[upperIndex];this.Query(lowerIndexOut,upperIndexOut,lowerValues[0],upperValues[0],this.m_bounds[0],2*this.m_proxyCount,0);this.Query(lowerIndexOut,upperIndexOut,lowerValues[1],upperValues[1],this.m_bounds[1],2*this.m_proxyCount,1);var count=0;for(var i=0;i<this.m_queryResultCount&&count<maxCount;++i,++count)
{var proxy=this.m_proxyPool[this.m_queryResults[i]];userData[i]=proxy.userData;}
this.m_queryResultCount=0;this.IncrementTimeStamp();return count;},Validate:function(){var pair;var proxy1;var proxy2;var overlap;for(var axis=0;axis<2;++axis)
{var bounds=this.m_bounds[axis];var boundCount=2*this.m_proxyCount;var stabbingCount=0;for(var i=0;i<boundCount;++i)
{var bound=bounds[i];if(bound.IsLower()==true)
{stabbingCount++;}
else
{stabbingCount--;}}}},ComputeBounds:function(lowerValues,upperValues,aabb)
{var minVertexX=aabb.minVertex.x;var minVertexY=aabb.minVertex.y;minVertexX=b2Math.b2Min(minVertexX,this.m_worldAABB.maxVertex.x);minVertexY=b2Math.b2Min(minVertexY,this.m_worldAABB.maxVertex.y);minVertexX=b2Math.b2Max(minVertexX,this.m_worldAABB.minVertex.x);minVertexY=b2Math.b2Max(minVertexY,this.m_worldAABB.minVertex.y);var maxVertexX=aabb.maxVertex.x;var maxVertexY=aabb.maxVertex.y;maxVertexX=b2Math.b2Min(maxVertexX,this.m_worldAABB.maxVertex.x);maxVertexY=b2Math.b2Min(maxVertexY,this.m_worldAABB.maxVertex.y);maxVertexX=b2Math.b2Max(maxVertexX,this.m_worldAABB.minVertex.x);maxVertexY=b2Math.b2Max(maxVertexY,this.m_worldAABB.minVertex.y);lowerValues[0]=(this.m_quantizationFactor.x*(minVertexX-this.m_worldAABB.minVertex.x))&(b2Settings.USHRT_MAX-1);upperValues[0]=((this.m_quantizationFactor.x*(maxVertexX-this.m_worldAABB.minVertex.x))&0x0000ffff)|1;lowerValues[1]=(this.m_quantizationFactor.y*(minVertexY-this.m_worldAABB.minVertex.y))&(b2Settings.USHRT_MAX-1);upperValues[1]=((this.m_quantizationFactor.y*(maxVertexY-this.m_worldAABB.minVertex.y))&0x0000ffff)|1;},TestOverlapValidate:function(p1,p2){for(var axis=0;axis<2;++axis)
{var bounds=this.m_bounds[axis];if(bounds[p1.lowerBounds[axis]].value>bounds[p2.upperBounds[axis]].value)
return false;if(bounds[p1.upperBounds[axis]].value<bounds[p2.lowerBounds[axis]].value)
return false;}
return true;},TestOverlap:function(b,p)
{for(var axis=0;axis<2;++axis)
{var bounds=this.m_bounds[axis];if(b.lowerValues[axis]>bounds[p.upperBounds[axis]].value)
return false;if(b.upperValues[axis]<bounds[p.lowerBounds[axis]].value)
return false;}
return true;},Query:function(lowerQueryOut,upperQueryOut,lowerValue,upperValue,bounds,boundCount,axis){var lowerQuery=b2BroadPhase.BinarySearch(bounds,boundCount,lowerValue);var upperQuery=b2BroadPhase.BinarySearch(bounds,boundCount,upperValue);for(var j=lowerQuery;j<upperQuery;++j)
{if(bounds[j].IsLower())
{this.IncrementOverlapCount(bounds[j].proxyId);}}
if(lowerQuery>0)
{var i=lowerQuery-1;var s=bounds[i].stabbingCount;while(s)
{if(bounds[i].IsLower())
{var proxy=this.m_proxyPool[bounds[i].proxyId];if(lowerQuery<=proxy.upperBounds[axis])
{this.IncrementOverlapCount(bounds[i].proxyId);--s;}}
--i;}}
lowerQueryOut[0]=lowerQuery;upperQueryOut[0]=upperQuery;},IncrementOverlapCount:function(proxyId){var proxy=this.m_proxyPool[proxyId];if(proxy.timeStamp<this.m_timeStamp)
{proxy.timeStamp=this.m_timeStamp;proxy.overlapCount=1;}
else
{proxy.overlapCount=2;this.m_queryResults[this.m_queryResultCount]=proxyId;++this.m_queryResultCount;}},IncrementTimeStamp:function(){if(this.m_timeStamp==b2Settings.USHRT_MAX)
{for(var i=0;i<b2Settings.b2_maxProxies;++i)
{this.m_proxyPool[i].timeStamp=0;}
this.m_timeStamp=1;}
else
{++this.m_timeStamp;}},m_pairManager:new b2PairManager(),m_proxyPool:new Array(b2Settings.b2_maxPairs),m_freeProxy:0,m_bounds:new Array(2*b2Settings.b2_maxProxies),m_queryResults:new Array(b2Settings.b2_maxProxies),m_queryResultCount:0,m_worldAABB:null,m_quantizationFactor:new b2Vec2(),m_proxyCount:0,m_timeStamp:0};b2BroadPhase.s_validate=false;b2BroadPhase.b2_invalid=b2Settings.USHRT_MAX;b2BroadPhase.b2_nullEdge=b2Settings.USHRT_MAX;b2BroadPhase.BinarySearch=function(bounds,count,value)
{var low=0;var high=count-1;while(low<=high)
{var mid=Math.floor((low+high)/2);if(bounds[mid].value>value)
{high=mid-1;}
else if(bounds[mid].value<value)
{low=mid+1;}
else
{return(mid);}}
return(low);};
var b2Collision=Class.create();b2Collision.prototype={initialize:function(){}}
b2Collision.b2_nullFeature=0x000000ff;b2Collision.ClipSegmentToLine=function(vOut,vIn,normal,offset)
{var numOut=0;var vIn0=vIn[0].v;var vIn1=vIn[1].v;var distance0=b2Math.b2Dot(normal,vIn[0].v)-offset;var distance1=b2Math.b2Dot(normal,vIn[1].v)-offset;if(distance0<=0.0)vOut[numOut++]=vIn[0];if(distance1<=0.0)vOut[numOut++]=vIn[1];if(distance0*distance1<0.0)
{var interp=distance0/(distance0-distance1);var tVec=vOut[numOut].v;tVec.x=vIn0.x+interp*(vIn1.x-vIn0.x);tVec.y=vIn0.y+interp*(vIn1.y-vIn0.y);if(distance0>0.0)
{vOut[numOut].id=vIn[0].id;}
else
{vOut[numOut].id=vIn[1].id;}
++numOut;}
return numOut;};b2Collision.EdgeSeparation=function(poly1,edge1,poly2)
{var vert1s=poly1.m_vertices;var count2=poly2.m_vertexCount;var vert2s=poly2.m_vertices;var normalX=poly1.m_normals[edge1].x;var normalY=poly1.m_normals[edge1].y;var tX=normalX;var tMat=poly1.m_R;normalX=tMat.col1.x*tX+tMat.col2.x*normalY;normalY=tMat.col1.y*tX+tMat.col2.y*normalY;var normalLocal2X=normalX;var normalLocal2Y=normalY;tMat=poly2.m_R;tX=normalLocal2X*tMat.col1.x+normalLocal2Y*tMat.col1.y;normalLocal2Y=normalLocal2X*tMat.col2.x+normalLocal2Y*tMat.col2.y;normalLocal2X=tX;var vertexIndex2=0;var minDot=Number.MAX_VALUE;for(var i=0;i<count2;++i)
{var tVec=vert2s[i];var dot=tVec.x*normalLocal2X+tVec.y*normalLocal2Y;if(dot<minDot)
{minDot=dot;vertexIndex2=i;}}
tMat=poly1.m_R;var v1X=poly1.m_position.x+(tMat.col1.x*vert1s[edge1].x+tMat.col2.x*vert1s[edge1].y)
var v1Y=poly1.m_position.y+(tMat.col1.y*vert1s[edge1].x+tMat.col2.y*vert1s[edge1].y)
tMat=poly2.m_R;var v2X=poly2.m_position.x+(tMat.col1.x*vert2s[vertexIndex2].x+tMat.col2.x*vert2s[vertexIndex2].y)
var v2Y=poly2.m_position.y+(tMat.col1.y*vert2s[vertexIndex2].x+tMat.col2.y*vert2s[vertexIndex2].y)
v2X-=v1X;v2Y-=v1Y;var separation=v2X*normalX+v2Y*normalY;return separation;};b2Collision.FindMaxSeparation=function(edgeIndex,poly1,poly2,conservative)
{var count1=poly1.m_vertexCount;var dX=poly2.m_position.x-poly1.m_position.x;var dY=poly2.m_position.y-poly1.m_position.y;var dLocal1X=(dX*poly1.m_R.col1.x+dY*poly1.m_R.col1.y);var dLocal1Y=(dX*poly1.m_R.col2.x+dY*poly1.m_R.col2.y);var edge=0;var maxDot=-Number.MAX_VALUE;for(var i=0;i<count1;++i)
{var dot=(poly1.m_normals[i].x*dLocal1X+poly1.m_normals[i].y*dLocal1Y);if(dot>maxDot)
{maxDot=dot;edge=i;}}
var s=b2Collision.EdgeSeparation(poly1,edge,poly2);if(s>0.0&&conservative==false)
{return s;}
var prevEdge=edge-1>=0?edge-1:count1-1;var sPrev=b2Collision.EdgeSeparation(poly1,prevEdge,poly2);if(sPrev>0.0&&conservative==false)
{return sPrev;}
var nextEdge=edge+1<count1?edge+1:0;var sNext=b2Collision.EdgeSeparation(poly1,nextEdge,poly2);if(sNext>0.0&&conservative==false)
{return sNext;}
var bestEdge=0;var bestSeparation;var increment=0;if(sPrev>s&&sPrev>sNext)
{increment=-1;bestEdge=prevEdge;bestSeparation=sPrev;}
else if(sNext>s)
{increment=1;bestEdge=nextEdge;bestSeparation=sNext;}
else
{edgeIndex[0]=edge;return s;}
while(true)
{if(increment==-1)
edge=bestEdge-1>=0?bestEdge-1:count1-1;else
edge=bestEdge+1<count1?bestEdge+1:0;s=b2Collision.EdgeSeparation(poly1,edge,poly2);if(s>0.0&&conservative==false)
{return s;}
if(s>bestSeparation)
{bestEdge=edge;bestSeparation=s;}
else
{break;}}
edgeIndex[0]=bestEdge;return bestSeparation;};b2Collision.FindIncidentEdge=function(c,poly1,edge1,poly2)
{var count1=poly1.m_vertexCount;var vert1s=poly1.m_vertices;var count2=poly2.m_vertexCount;var vert2s=poly2.m_vertices;var vertex11=edge1;var vertex12=edge1+1==count1?0:edge1+1;var tVec=vert1s[vertex12];var normal1Local1X=tVec.x;var normal1Local1Y=tVec.y;tVec=vert1s[vertex11];normal1Local1X-=tVec.x;normal1Local1Y-=tVec.y;var tX=normal1Local1X;normal1Local1X=normal1Local1Y;normal1Local1Y=-tX;var invLength=1.0/Math.sqrt(normal1Local1X*normal1Local1X+normal1Local1Y*normal1Local1Y);normal1Local1X*=invLength;normal1Local1Y*=invLength;var normal1X=normal1Local1X;var normal1Y=normal1Local1Y;tX=normal1X;var tMat=poly1.m_R;normal1X=tMat.col1.x*tX+tMat.col2.x*normal1Y;normal1Y=tMat.col1.y*tX+tMat.col2.y*normal1Y;var normal1Local2X=normal1X;var normal1Local2Y=normal1Y;tMat=poly2.m_R;tX=normal1Local2X*tMat.col1.x+normal1Local2Y*tMat.col1.y;normal1Local2Y=normal1Local2X*tMat.col2.x+normal1Local2Y*tMat.col2.y;normal1Local2X=tX;var vertex21=0;var vertex22=0;var minDot=Number.MAX_VALUE;for(var i=0;i<count2;++i)
{var i1=i;var i2=i+1<count2?i+1:0;tVec=vert2s[i2];var normal2Local2X=tVec.x;var normal2Local2Y=tVec.y;tVec=vert2s[i1];normal2Local2X-=tVec.x;normal2Local2Y-=tVec.y;tX=normal2Local2X;normal2Local2X=normal2Local2Y;normal2Local2Y=-tX;invLength=1.0/Math.sqrt(normal2Local2X*normal2Local2X+normal2Local2Y*normal2Local2Y);normal2Local2X*=invLength;normal2Local2Y*=invLength;var dot=normal2Local2X*normal1Local2X+normal2Local2Y*normal1Local2Y;if(dot<minDot)
{minDot=dot;vertex21=i1;vertex22=i2;}}
var tClip;tClip=c[0];tVec=tClip.v;tVec.SetV(vert2s[vertex21]);tVec.MulM(poly2.m_R);tVec.Add(poly2.m_position);tClip.id.features.referenceFace=edge1;tClip.id.features.incidentEdge=vertex21;tClip.id.features.incidentVertex=vertex21;tClip=c[1];tVec=tClip.v;tVec.SetV(vert2s[vertex22]);tVec.MulM(poly2.m_R);tVec.Add(poly2.m_position);tClip.id.features.referenceFace=edge1;tClip.id.features.incidentEdge=vertex21;tClip.id.features.incidentVertex=vertex22;};b2Collision.b2CollidePolyTempVec=new b2Vec2();b2Collision.b2CollidePoly=function(manifold,polyA,polyB,conservative)
{manifold.pointCount=0;var edgeA=0;var edgeAOut=[edgeA];var separationA=b2Collision.FindMaxSeparation(edgeAOut,polyA,polyB,conservative);edgeA=edgeAOut[0];if(separationA>0.0&&conservative==false)
return;var edgeB=0;var edgeBOut=[edgeB];var separationB=b2Collision.FindMaxSeparation(edgeBOut,polyB,polyA,conservative);edgeB=edgeBOut[0];if(separationB>0.0&&conservative==false)
return;var poly1;var poly2;var edge1=0;var flip=0;var k_relativeTol=0.98;var k_absoluteTol=0.001;if(separationB>k_relativeTol*separationA+k_absoluteTol)
{poly1=polyB;poly2=polyA;edge1=edgeB;flip=1;}
else
{poly1=polyA;poly2=polyB;edge1=edgeA;flip=0;}
var incidentEdge=[new ClipVertex(),new ClipVertex()];b2Collision.FindIncidentEdge(incidentEdge,poly1,edge1,poly2);var count1=poly1.m_vertexCount;var vert1s=poly1.m_vertices;var v11=vert1s[edge1];var v12=edge1+1<count1?vert1s[edge1+1]:vert1s[0];var dvX=v12.x-v11.x;var dvY=v12.y-v11.y;var sideNormalX=v12.x-v11.x;var sideNormalY=v12.y-v11.y;var tX=sideNormalX;var tMat=poly1.m_R;sideNormalX=tMat.col1.x*tX+tMat.col2.x*sideNormalY;sideNormalY=tMat.col1.y*tX+tMat.col2.y*sideNormalY;var invLength=1.0/Math.sqrt(sideNormalX*sideNormalX+sideNormalY*sideNormalY);sideNormalX*=invLength;sideNormalY*=invLength;var frontNormalX=sideNormalX;var frontNormalY=sideNormalY;tX=frontNormalX;frontNormalX=frontNormalY;frontNormalY=-tX;var v11X=v11.x;var v11Y=v11.y;tX=v11X;tMat=poly1.m_R;v11X=tMat.col1.x*tX+tMat.col2.x*v11Y;v11Y=tMat.col1.y*tX+tMat.col2.y*v11Y;v11X+=poly1.m_position.x;v11Y+=poly1.m_position.y;var v12X=v12.x;var v12Y=v12.y;tX=v12X;tMat=poly1.m_R;v12X=tMat.col1.x*tX+tMat.col2.x*v12Y;v12Y=tMat.col1.y*tX+tMat.col2.y*v12Y;v12X+=poly1.m_position.x;v12Y+=poly1.m_position.y;var frontOffset=frontNormalX*v11X+frontNormalY*v11Y;var sideOffset1=-(sideNormalX*v11X+sideNormalY*v11Y);var sideOffset2=sideNormalX*v12X+sideNormalY*v12Y;var clipPoints1=[new ClipVertex(),new ClipVertex()];var clipPoints2=[new ClipVertex(),new ClipVertex()];var np=0;b2Collision.b2CollidePolyTempVec.Set(-sideNormalX,-sideNormalY);np=b2Collision.ClipSegmentToLine(clipPoints1,incidentEdge,b2Collision.b2CollidePolyTempVec,sideOffset1);if(np<2)
return;b2Collision.b2CollidePolyTempVec.Set(sideNormalX,sideNormalY);np=b2Collision.ClipSegmentToLine(clipPoints2,clipPoints1,b2Collision.b2CollidePolyTempVec,sideOffset2);if(np<2)
return;if(flip){manifold.normal.Set(-frontNormalX,-frontNormalY);}
else{manifold.normal.Set(frontNormalX,frontNormalY);}
var pointCount=0;for(var i=0;i<b2Settings.b2_maxManifoldPoints;++i)
{var tVec=clipPoints2[i].v;var separation=(frontNormalX*tVec.x+frontNormalY*tVec.y)-frontOffset;if(separation<=0.0||conservative==true)
{var cp=manifold.points[pointCount];cp.separation=separation;cp.position.SetV(clipPoints2[i].v);cp.id.Set(clipPoints2[i].id);cp.id.features.flip=flip;++pointCount;}}
manifold.pointCount=pointCount;};b2Collision.b2CollideCircle=function(manifold,circle1,circle2,conservative)
{manifold.pointCount=0;var dX=circle2.m_position.x-circle1.m_position.x;var dY=circle2.m_position.y-circle1.m_position.y;var distSqr=dX*dX+dY*dY;var radiusSum=circle1.m_radius+circle2.m_radius;if(distSqr>radiusSum*radiusSum&&conservative==false)
{return;}
var separation;if(distSqr<Number.MIN_VALUE)
{separation=-radiusSum;manifold.normal.Set(0.0,1.0);}
else
{var dist=Math.sqrt(distSqr);separation=dist-radiusSum;var a=1.0/dist;manifold.normal.x=a*dX;manifold.normal.y=a*dY;}
manifold.pointCount=1;var tPoint=manifold.points[0];tPoint.id.set_key(0);tPoint.separation=separation;tPoint.position.x=circle2.m_position.x-(circle2.m_radius*manifold.normal.x);tPoint.position.y=circle2.m_position.y-(circle2.m_radius*manifold.normal.y);};b2Collision.b2CollidePolyAndCircle=function(manifold,poly,circle,conservative)
{manifold.pointCount=0;var tPoint;var dX;var dY;var xLocalX=circle.m_position.x-poly.m_position.x;var xLocalY=circle.m_position.y-poly.m_position.y;var tMat=poly.m_R;var tX=xLocalX*tMat.col1.x+xLocalY*tMat.col1.y;xLocalY=xLocalX*tMat.col2.x+xLocalY*tMat.col2.y;xLocalX=tX;var dist;var normalIndex=0;var separation=-Number.MAX_VALUE;var radius=circle.m_radius;for(var i=0;i<poly.m_vertexCount;++i)
{var s=poly.m_normals[i].x*(xLocalX-poly.m_vertices[i].x)+poly.m_normals[i].y*(xLocalY-poly.m_vertices[i].y);if(s>radius)
{return;}
if(s>separation)
{separation=s;normalIndex=i;}}
if(separation<Number.MIN_VALUE)
{manifold.pointCount=1;var tVec=poly.m_normals[normalIndex];manifold.normal.x=tMat.col1.x*tVec.x+tMat.col2.x*tVec.y;manifold.normal.y=tMat.col1.y*tVec.x+tMat.col2.y*tVec.y;tPoint=manifold.points[0];tPoint.id.features.incidentEdge=normalIndex;tPoint.id.features.incidentVertex=b2Collision.b2_nullFeature;tPoint.id.features.referenceFace=b2Collision.b2_nullFeature;tPoint.id.features.flip=0;tPoint.position.x=circle.m_position.x-radius*manifold.normal.x;tPoint.position.y=circle.m_position.y-radius*manifold.normal.y;tPoint.separation=separation-radius;return;}
var vertIndex1=normalIndex;var vertIndex2=vertIndex1+1<poly.m_vertexCount?vertIndex1+1:0;var eX=poly.m_vertices[vertIndex2].x-poly.m_vertices[vertIndex1].x;var eY=poly.m_vertices[vertIndex2].y-poly.m_vertices[vertIndex1].y;var length=Math.sqrt(eX*eX+eY*eY);eX/=length;eY/=length;if(length<Number.MIN_VALUE)
{dX=xLocalX-poly.m_vertices[vertIndex1].x;dY=xLocalY-poly.m_vertices[vertIndex1].y;dist=Math.sqrt(dX*dX+dY*dY);dX/=dist;dY/=dist;if(dist>radius)
{return;}
manifold.pointCount=1;manifold.normal.Set(tMat.col1.x*dX+tMat.col2.x*dY,tMat.col1.y*dX+tMat.col2.y*dY);tPoint=manifold.points[0];tPoint.id.features.incidentEdge=b2Collision.b2_nullFeature;tPoint.id.features.incidentVertex=vertIndex1;tPoint.id.features.referenceFace=b2Collision.b2_nullFeature;tPoint.id.features.flip=0;tPoint.position.x=circle.m_position.x-radius*manifold.normal.x;tPoint.position.y=circle.m_position.y-radius*manifold.normal.y;tPoint.separation=dist-radius;return;}
var u=(xLocalX-poly.m_vertices[vertIndex1].x)*eX+(xLocalY-poly.m_vertices[vertIndex1].y)*eY;tPoint=manifold.points[0];tPoint.id.features.incidentEdge=b2Collision.b2_nullFeature;tPoint.id.features.incidentVertex=b2Collision.b2_nullFeature;tPoint.id.features.referenceFace=b2Collision.b2_nullFeature;tPoint.id.features.flip=0;var pX,pY;if(u<=0.0)
{pX=poly.m_vertices[vertIndex1].x;pY=poly.m_vertices[vertIndex1].y;tPoint.id.features.incidentVertex=vertIndex1;}
else if(u>=length)
{pX=poly.m_vertices[vertIndex2].x;pY=poly.m_vertices[vertIndex2].y;tPoint.id.features.incidentVertex=vertIndex2;}
else
{pX=eX*u+poly.m_vertices[vertIndex1].x;pY=eY*u+poly.m_vertices[vertIndex1].y;tPoint.id.features.incidentEdge=vertIndex1;}
dX=xLocalX-pX;dY=xLocalY-pY;dist=Math.sqrt(dX*dX+dY*dY);dX/=dist;dY/=dist;if(dist>radius)
{return;}
manifold.pointCount=1;manifold.normal.Set(tMat.col1.x*dX+tMat.col2.x*dY,tMat.col1.y*dX+tMat.col2.y*dY);tPoint.position.x=circle.m_position.x-radius*manifold.normal.x;tPoint.position.y=circle.m_position.y-radius*manifold.normal.y;tPoint.separation=dist-radius;};b2Collision.b2TestOverlap=function(a,b)
{var t1=b.minVertex;var t2=a.maxVertex;var d1X=t1.x-t2.x;var d1Y=t1.y-t2.y;t1=a.minVertex;t2=b.maxVertex;var d2X=t1.x-t2.x;var d2Y=t1.y-t2.y;if(d1X>0.0||d1Y>0.0)
return false;if(d2X>0.0||d2Y>0.0)
return false;return true;};
var Features=Class.create();Features.prototype={set_referenceFace:function(value){this._referenceFace=value;this._m_id._key=(this._m_id._key&0xffffff00)|(this._referenceFace&0x000000ff)},get_referenceFace:function(){return this._referenceFace;},_referenceFace:0,set_incidentEdge:function(value){this._incidentEdge=value;this._m_id._key=(this._m_id._key&0xffff00ff)|((this._incidentEdge<<8)&0x0000ff00)},get_incidentEdge:function(){return this._incidentEdge;},_incidentEdge:0,set_incidentVertex:function(value){this._incidentVertex=value;this._m_id._key=(this._m_id._key&0xff00ffff)|((this._incidentVertex<<16)&0x00ff0000)},get_incidentVertex:function(){return this._incidentVertex;},_incidentVertex:0,set_flip:function(value){this._flip=value;this._m_id._key=(this._m_id._key&0x00ffffff)|((this._flip<<24)&0xff000000)},get_flip:function(){return this._flip;},_flip:0,_m_id:null,initialize:function(){}};锘�
var b2ContactID=Class.create();b2ContactID.prototype={initialize:function(){this.features=new Features();this.features._m_id=this;},Set:function(id){this.set_key(id._key);},Copy:function(){var id=new b2ContactID();id.set_key(this._key);return id;},get_key:function(){return this._key;},set_key:function(value){this._key=value;this.features._referenceFace=this._key&0x000000ff;this.features._incidentEdge=((this._key&0x0000ff00)>>8)&0x000000ff;this.features._incidentVertex=((this._key&0x00ff0000)>>16)&0x000000ff;this.features._flip=((this._key&0xff000000)>>24)&0x000000ff;},features:new Features(),_key:0};锘�
var b2ContactPoint=Class.create();b2ContactPoint.prototype={position:new b2Vec2(),separation:null,normalImpulse:null,tangentImpulse:null,id:new b2ContactID(),initialize:function(){this.position=new b2Vec2();this.id=new b2ContactID();}};var b2Distance=Class.create();b2Distance.prototype={initialize:function(){}};b2Distance.ProcessTwo=function(p1Out,p2Out,p1s,p2s,points)
{var rX=-points[1].x;var rY=-points[1].y;var dX=points[0].x-points[1].x;var dY=points[0].y-points[1].y;var length=Math.sqrt(dX*dX+dY*dY);dX/=length;dY/=length;var lambda=rX*dX+rY*dY;if(lambda<=0.0||length<Number.MIN_VALUE)
{p1Out.SetV(p1s[1]);p2Out.SetV(p2s[1]);p1s[0].SetV(p1s[1]);p2s[0].SetV(p2s[1]);points[0].SetV(points[1]);return 1;}
lambda/=length;p1Out.x=p1s[1].x+lambda*(p1s[0].x-p1s[1].x);p1Out.y=p1s[1].y+lambda*(p1s[0].y-p1s[1].y);p2Out.x=p2s[1].x+lambda*(p2s[0].x-p2s[1].x);p2Out.y=p2s[1].y+lambda*(p2s[0].y-p2s[1].y);return 2;};b2Distance.ProcessThree=function(p1Out,p2Out,p1s,p2s,points)
{var aX=points[0].x;var aY=points[0].y;var bX=points[1].x;var bY=points[1].y;var cX=points[2].x;var cY=points[2].y;var abX=bX-aX;var abY=bY-aY;var acX=cX-aX;var acY=cY-aY;var bcX=cX-bX;var bcY=cY-bY;var sn=-(aX*abX+aY*abY);var sd=(bX*abX+bY*abY);var tn=-(aX*acX+aY*acY);var td=(cX*acX+cY*acY);var un=-(bX*bcX+bY*bcY);var ud=(cX*bcX+cY*bcY);if(td<=0.0&&ud<=0.0)
{p1Out.SetV(p1s[2]);p2Out.SetV(p2s[2]);p1s[0].SetV(p1s[2]);p2s[0].SetV(p2s[2]);points[0].SetV(points[2]);return 1;}
var n=abX*acY-abY*acX;var vc=n*(aX*bY-aY*bX);var va=n*(bX*cY-bY*cX);if(va<=0.0&&un>=0.0&&ud>=0.0)
{var lambda=un/(un+ud);p1Out.x=p1s[1].x+lambda*(p1s[2].x-p1s[1].x);p1Out.y=p1s[1].y+lambda*(p1s[2].y-p1s[1].y);p2Out.x=p2s[1].x+lambda*(p2s[2].x-p2s[1].x);p2Out.y=p2s[1].y+lambda*(p2s[2].y-p2s[1].y);p1s[0].SetV(p1s[2]);p2s[0].SetV(p2s[2]);points[0].SetV(points[2]);return 2;}
var vb=n*(cX*aY-cY*aX);if(vb<=0.0&&tn>=0.0&&td>=0.0)
{var lambda=tn/(tn+td);p1Out.x=p1s[0].x+lambda*(p1s[2].x-p1s[0].x);p1Out.y=p1s[0].y+lambda*(p1s[2].y-p1s[0].y);p2Out.x=p2s[0].x+lambda*(p2s[2].x-p2s[0].x);p2Out.y=p2s[0].y+lambda*(p2s[2].y-p2s[0].y);p1s[1].SetV(p1s[2]);p2s[1].SetV(p2s[2]);points[1].SetV(points[2]);return 2;}
var denom=va+vb+vc;denom=1.0/denom;var u=va*denom;var v=vb*denom;var w=1.0-u-v;p1Out.x=u*p1s[0].x+v*p1s[1].x+w*p1s[2].x;p1Out.y=u*p1s[0].y+v*p1s[1].y+w*p1s[2].y;p2Out.x=u*p2s[0].x+v*p2s[1].x+w*p2s[2].x;p2Out.y=u*p2s[0].y+v*p2s[1].y+w*p2s[2].y;return 3;};b2Distance.InPoinsts=function(w,points,pointCount)
{for(var i=0;i<pointCount;++i)
{if(w.x==points[i].x&&w.y==points[i].y)
{return true;}}
return false;};b2Distance.Distance=function(p1Out,p2Out,shape1,shape2)
{var p1s=new Array(3);var p2s=new Array(3);var points=new Array(3);var pointCount=0;p1Out.SetV(shape1.m_position);p2Out.SetV(shape2.m_position);var vSqr=0.0;var maxIterations=20;for(var iter=0;iter<maxIterations;++iter)
{var vX=p2Out.x-p1Out.x;var vY=p2Out.y-p1Out.y;var w1=shape1.Support(vX,vY);var w2=shape2.Support(-vX,-vY);vSqr=(vX*vX+vY*vY);var wX=w2.x-w1.x;var wY=w2.y-w1.y;var vw=(vX*wX+vY*wY);if(vSqr-b2Dot(vX*wX+vY*wY)<=0.01*vSqr)
{if(pointCount==0)
{p1Out.SetV(w1);p2Out.SetV(w2);}
b2Distance.g_GJK_Iterations=iter;return Math.sqrt(vSqr);}
switch(pointCount)
{case 0:p1s[0].SetV(w1);p2s[0].SetV(w2);points[0]=w;p1Out.SetV(p1s[0]);p2Out.SetV(p2s[0]);++pointCount;break;case 1:p1s[1].SetV(w1);p2s[1].SetV(w2);points[1].x=wX;points[1].y=wY;pointCount=b2Distance.ProcessTwo(p1Out,p2Out,p1s,p2s,points);break;case 2:p1s[2].SetV(w1);p2s[2].SetV(w2);points[2].x=wX;points[2].y=wY;pointCount=b2Distance.ProcessThree(p1Out,p2Out,p1s,p2s,points);break;}
if(pointCount==3)
{b2Distance.g_GJK_Iterations=iter;return 0.0;}
var maxSqr=-Number.MAX_VALUE;for(var i=0;i<pointCount;++i)
{maxSqr=b2Math.b2Max(maxSqr,(points[i].x*points[i].x+points[i].y*points[i].y));}
if(pointCount==3||vSqr<=100.0*Number.MIN_VALUE*maxSqr)
{b2Distance.g_GJK_Iterations=iter;return Math.sqrt(vSqr);}}
b2Distance.g_GJK_Iterations=maxIterations;return Math.sqrt(vSqr);};b2Distance.g_GJK_Iterations=0;
var b2Manifold=Class.create();b2Manifold.prototype={initialize:function(){this.points=new Array(b2Settings.b2_maxManifoldPoints);for(var i=0;i<b2Settings.b2_maxManifoldPoints;i++){this.points[i]=new b2ContactPoint();}
this.normal=new b2Vec2();},points:null,normal:null,pointCount:0};
var b2OBB=Class.create();b2OBB.prototype={R:new b2Mat22(),center:new b2Vec2(),extents:new b2Vec2(),initialize:function(){this.R=new b2Mat22();this.center=new b2Vec2();this.extents=new b2Vec2();}};
var b2Proxy=Class.create();b2Proxy.prototype={GetNext:function(){return this.lowerBounds[0];},SetNext:function(next){this.lowerBounds[0]=next;},IsValid:function(){return this.overlapCount!=b2BroadPhase.b2_invalid;},lowerBounds:[(0),(0)],upperBounds:[(0),(0)],overlapCount:0,timeStamp:0,userData:null,initialize:function(){this.lowerBounds=[(0),(0)];this.upperBounds=[(0),(0)];}}
var ClipVertex=Class.create();ClipVertex.prototype={v:new b2Vec2(),id:new b2ContactID(),initialize:function(){this.v=new b2Vec2();this.id=new b2ContactID();}};var b2Shape=Class.create();b2Shape.prototype={TestPoint:function(p){return false},GetUserData:function(){return this.m_userData;},GetType:function(){return this.m_type;},GetBody:function(){return this.m_body;},GetPosition:function(){return this.m_position;},GetRotationMatrix:function(){return this.m_R;},ResetProxy:function(broadPhase){},GetNext:function(){return this.m_next;},initialize:function(def,body){this.m_R=new b2Mat22();this.m_position=new b2Vec2();this.m_userData=def.userData;this.m_friction=def.friction;this.m_restitution=def.restitution;this.m_body=body;this.m_proxyId=b2Pair.b2_nullProxy;this.m_maxRadius=0.0;this.m_categoryBits=def.categoryBits;this.m_maskBits=def.maskBits;this.m_groupIndex=def.groupIndex;},DestroyProxy:function()
{if(this.m_proxyId!=b2Pair.b2_nullProxy)
{this.m_body.m_world.m_broadPhase.DestroyProxy(this.m_proxyId);this.m_proxyId=b2Pair.b2_nullProxy;}},Synchronize:function(position1,R1,position2,R2){},QuickSync:function(position,R){},Support:function(dX,dY,out){},GetMaxRadius:function(){return this.m_maxRadius;},m_next:null,m_R:new b2Mat22(),m_position:new b2Vec2(),m_type:0,m_userData:null,m_body:null,m_friction:null,m_restitution:null,m_maxRadius:null,m_proxyId:0,m_categoryBits:0,m_maskBits:0,m_groupIndex:0};b2Shape.Create=function(def,body,center){switch(def.type)
{case b2Shape.e_circleShape:{return new b2CircleShape(def,body,center);}
case b2Shape.e_boxShape:case b2Shape.e_polyShape:{return new b2PolyShape(def,body,center);}}
return null;};b2Shape.Destroy=function(shape)
{if(shape.m_proxyId!=b2Pair.b2_nullProxy)
shape.m_body.m_world.m_broadPhase.DestroyProxy(shape.m_proxyId);};b2Shape.e_unknownShape=-1;b2Shape.e_circleShape=0;b2Shape.e_boxShape=1;b2Shape.e_polyShape=2;b2Shape.e_meshShape=3;b2Shape.e_shapeTypeCount=4;b2Shape.PolyMass=function(massData,vs,count,rho)
{var center=new b2Vec2();center.SetZero();var area=0.0;var I=0.0;var pRef=new b2Vec2(0.0,0.0);var inv3=1.0/3.0;for(var i=0;i<count;++i)
{var p1=pRef;var p2=vs[i];var p3=i+1<count?vs[i+1]:vs[0];var e1=b2Math.SubtractVV(p2,p1);var e2=b2Math.SubtractVV(p3,p1);var D=b2Math.b2CrossVV(e1,e2);var triangleArea=0.5*D;area+=triangleArea;var tVec=new b2Vec2();tVec.SetV(p1);tVec.Add(p2);tVec.Add(p3);tVec.Multiply(inv3*triangleArea);center.Add(tVec);var px=p1.x;var py=p1.y;var ex1=e1.x;var ey1=e1.y;var ex2=e2.x;var ey2=e2.y;var intx2=inv3*(0.25*(ex1*ex1+ex2*ex1+ex2*ex2)+(px*ex1+px*ex2))+0.5*px*px;var inty2=inv3*(0.25*(ey1*ey1+ey2*ey1+ey2*ey2)+(py*ey1+py*ey2))+0.5*py*py;I+=D*(intx2+inty2);}
massData.mass=rho*area;center.Multiply(1.0/area);massData.center=center;I=rho*(I-area*b2Math.b2Dot(center,center));massData.I=I;};b2Shape.PolyCentroid=function(vs,count,out)
{var cX=0.0;var cY=0.0;var area=0.0;var pRefX=0.0;var pRefY=0.0;var inv3=1.0/3.0;for(var i=0;i<count;++i)
{var p1X=pRefX;var p1Y=pRefY;var p2X=vs[i].x;var p2Y=vs[i].y;var p3X=i+1<count?vs[i+1].x:vs[0].x;var p3Y=i+1<count?vs[i+1].y:vs[0].y;var e1X=p2X-p1X;var e1Y=p2Y-p1Y;var e2X=p3X-p1X;var e2Y=p3Y-p1Y;var D=(e1X*e2Y-e1Y*e2X);var triangleArea=0.5*D;area+=triangleArea;cX+=triangleArea*inv3*(p1X+p2X+p3X);cY+=triangleArea*inv3*(p1Y+p2Y+p3Y);}
cX*=1.0/area;cY*=1.0/area;out.Set(cX,cY);};
var b2ShapeDef=Class.create();b2ShapeDef.prototype={initialize:function()
{this.type=b2Shape.e_unknownShape;this.userData=null;this.localPosition=new b2Vec2(0.0,0.0);this.localRotation=0.0;this.friction=0.2;this.restitution=0.0;this.density=0.0;this.categoryBits=0x0001;this.maskBits=0xFFFF;this.groupIndex=0;},ComputeMass:function(massData)
{massData.center=new b2Vec2(0.0,0.0)
if(this.density==0.0)
{massData.mass=0.0;massData.center.Set(0.0,0.0);massData.I=0.0;};switch(this.type)
{case b2Shape.e_circleShape:{var circle=this;massData.mass=this.density*b2Settings.b2_pi*circle.radius*circle.radius;massData.center.Set(0.0,0.0);massData.I=0.5*(massData.mass)*circle.radius*circle.radius;}
break;case b2Shape.e_boxShape:{var box=this;massData.mass=4.0*this.density*box.extents.x*box.extents.y;massData.center.Set(0.0,0.0);massData.I=massData.mass/3.0*b2Math.b2Dot(box.extents,box.extents);}
break;case b2Shape.e_polyShape:{var poly=this;b2Shape.PolyMass(massData,poly.vertices,poly.vertexCount,this.density);}
break;default:massData.mass=0.0;massData.center.Set(0.0,0.0);massData.I=0.0;break;}},type:0,userData:null,localPosition:null,localRotation:null,friction:null,restitution:null,density:null,categoryBits:0,maskBits:0,groupIndex:0};
var b2BoxDef=Class.create();Object.extend(b2BoxDef.prototype,b2ShapeDef.prototype);Object.extend(b2BoxDef.prototype,{initialize:function()
{this.type=b2Shape.e_unknownShape;this.userData=null;this.localPosition=new b2Vec2(0.0,0.0);this.localRotation=0.0;this.friction=0.2;this.restitution=0.0;this.density=0.0;this.categoryBits=0x0001;this.maskBits=0xFFFF;this.groupIndex=0;this.type=b2Shape.e_boxShape;this.extents=new b2Vec2(1.0,1.0);},extents:null});
var b2CircleDef=Class.create();Object.extend(b2CircleDef.prototype,b2ShapeDef.prototype);Object.extend(b2CircleDef.prototype,{initialize:function()
{this.type=b2Shape.e_unknownShape;this.userData=null;this.localPosition=new b2Vec2(0.0,0.0);this.localRotation=0.0;this.friction=0.2;this.restitution=0.0;this.density=0.0;this.categoryBits=0x0001;this.maskBits=0xFFFF;this.groupIndex=0;this.type=b2Shape.e_circleShape;this.radius=1.0;},radius:null});var b2CircleShape=Class.create();Object.extend(b2CircleShape.prototype,b2Shape.prototype);Object.extend(b2CircleShape.prototype,{TestPoint:function(p){var d=new b2Vec2();d.SetV(p);d.Subtract(this.m_position);return b2Math.b2Dot(d,d)<=this.m_radius*this.m_radius;},initialize:function(def,body,localCenter){this.m_R=new b2Mat22();this.m_position=new b2Vec2();this.m_userData=def.userData;this.m_friction=def.friction;this.m_restitution=def.restitution;this.m_body=body;this.m_proxyId=b2Pair.b2_nullProxy;this.m_maxRadius=0.0;this.m_categoryBits=def.categoryBits;this.m_maskBits=def.maskBits;this.m_groupIndex=def.groupIndex;this.m_localPosition=new b2Vec2();var circle=def;this.m_localPosition.Set(def.localPosition.x-localCenter.x,def.localPosition.y-localCenter.y);this.m_type=b2Shape.e_circleShape;this.m_radius=circle.radius;this.m_R.SetM(this.m_body.m_R);var rX=this.m_R.col1.x*this.m_localPosition.x+this.m_R.col2.x*this.m_localPosition.y;var rY=this.m_R.col1.y*this.m_localPosition.x+this.m_R.col2.y*this.m_localPosition.y;this.m_position.x=this.m_body.m_position.x+rX;this.m_position.y=this.m_body.m_position.y+rY;this.m_maxRadius=Math.sqrt(rX*rX+rY*rY)+this.m_radius;var aabb=new b2AABB();aabb.minVertex.Set(this.m_position.x-this.m_radius,this.m_position.y-this.m_radius);aabb.maxVertex.Set(this.m_position.x+this.m_radius,this.m_position.y+this.m_radius);var broadPhase=this.m_body.m_world.m_broadPhase;if(broadPhase.InRange(aabb))
{this.m_proxyId=broadPhase.CreateProxy(aabb,this);}
else
{this.m_proxyId=b2Pair.b2_nullProxy;}
if(this.m_proxyId==b2Pair.b2_nullProxy)
{this.m_body.Freeze();}},Synchronize:function(position1,R1,position2,R2){this.m_R.SetM(R2);this.m_position.x=(R2.col1.x*this.m_localPosition.x+R2.col2.x*this.m_localPosition.y)+position2.x;this.m_position.y=(R2.col1.y*this.m_localPosition.x+R2.col2.y*this.m_localPosition.y)+position2.y;if(this.m_proxyId==b2Pair.b2_nullProxy)
{return;}
var p1X=position1.x+(R1.col1.x*this.m_localPosition.x+R1.col2.x*this.m_localPosition.y);var p1Y=position1.y+(R1.col1.y*this.m_localPosition.x+R1.col2.y*this.m_localPosition.y);var lowerX=Math.min(p1X,this.m_position.x);var lowerY=Math.min(p1Y,this.m_position.y);var upperX=Math.max(p1X,this.m_position.x);var upperY=Math.max(p1Y,this.m_position.y);var aabb=new b2AABB();aabb.minVertex.Set(lowerX-this.m_radius,lowerY-this.m_radius);aabb.maxVertex.Set(upperX+this.m_radius,upperY+this.m_radius);var broadPhase=this.m_body.m_world.m_broadPhase;if(broadPhase.InRange(aabb))
{broadPhase.MoveProxy(this.m_proxyId,aabb);}
else
{this.m_body.Freeze();}},QuickSync:function(position,R){this.m_R.SetM(R);this.m_position.x=(R.col1.x*this.m_localPosition.x+R.col2.x*this.m_localPosition.y)+position.x;this.m_position.y=(R.col1.y*this.m_localPosition.x+R.col2.y*this.m_localPosition.y)+position.y;},ResetProxy:function(broadPhase)
{if(this.m_proxyId==b2Pair.b2_nullProxy)
{return;}
var proxy=broadPhase.GetProxy(this.m_proxyId);broadPhase.DestroyProxy(this.m_proxyId);proxy=null;var aabb=new b2AABB();aabb.minVertex.Set(this.m_position.x-this.m_radius,this.m_position.y-this.m_radius);aabb.maxVertex.Set(this.m_position.x+this.m_radius,this.m_position.y+this.m_radius);if(broadPhase.InRange(aabb))
{this.m_proxyId=broadPhase.CreateProxy(aabb,this);}
else
{this.m_proxyId=b2Pair.b2_nullProxy;}
if(this.m_proxyId==b2Pair.b2_nullProxy)
{this.m_body.Freeze();}},Support:function(dX,dY,out)
{var len=Math.sqrt(dX*dX+dY*dY);dX/=len;dY/=len;out.Set(this.m_position.x+this.m_radius*dX,this.m_position.y+this.m_radius*dY);},m_localPosition:new b2Vec2(),m_radius:null});
var b2MassData=Class.create();b2MassData.prototype={mass:0.0,center:new b2Vec2(0,0),I:0.0,initialize:function(){this.center=new b2Vec2(0,0);}}

var b2PolyDef=Class.create();Object.extend(b2PolyDef.prototype,b2ShapeDef.prototype);Object.extend(b2PolyDef.prototype,{initialize:function()
{this.type=b2Shape.e_unknownShape;this.userData=null;this.localPosition=new b2Vec2(0.0,0.0);this.localRotation=0.0;this.friction=0.2;this.restitution=0.0;this.density=0.0;this.categoryBits=0x0001;this.maskBits=0xFFFF;this.groupIndex=0;this.vertices=new Array(b2Settings.b2_maxPolyVertices);this.type=b2Shape.e_polyShape;this.vertexCount=0;for(var i=0;i<b2Settings.b2_maxPolyVertices;i++){this.vertices[i]=new b2Vec2();}},vertices:new Array(b2Settings.b2_maxPolyVertices),vertexCount:0});var b2PolyShape=Class.create();Object.extend(b2PolyShape.prototype,b2Shape.prototype);Object.extend(b2PolyShape.prototype,{TestPoint:function(p){var pLocal=new b2Vec2();pLocal.SetV(p);pLocal.Subtract(this.m_position);pLocal.MulTM(this.m_R);for(var i=0;i<this.m_vertexCount;++i)
{var tVec=new b2Vec2();tVec.SetV(pLocal);tVec.Subtract(this.m_vertices[i]);var dot=b2Math.b2Dot(this.m_normals[i],tVec);if(dot>0.0)
{return false;}}
return true;},initialize:function(def,body,newOrigin){this.m_R=new b2Mat22();this.m_position=new b2Vec2();this.m_userData=def.userData;this.m_friction=def.friction;this.m_restitution=def.restitution;this.m_body=body;this.m_proxyId=b2Pair.b2_nullProxy;this.m_maxRadius=0.0;this.m_categoryBits=def.categoryBits;this.m_maskBits=def.maskBits;this.m_groupIndex=def.groupIndex;this.syncAABB=new b2AABB();this.syncMat=new b2Mat22();this.m_localCentroid=new b2Vec2();this.m_localOBB=new b2OBB();var i=0;var hX;var hY;var tVec;var aabb=new b2AABB();this.m_vertices=new Array(b2Settings.b2_maxPolyVertices);this.m_coreVertices=new Array(b2Settings.b2_maxPolyVertices);this.m_normals=new Array(b2Settings.b2_maxPolyVertices);this.m_type=b2Shape.e_polyShape;var localR=new b2Mat22(def.localRotation);if(def.type==b2Shape.e_boxShape)
{this.m_localCentroid.x=def.localPosition.x-newOrigin.x;this.m_localCentroid.y=def.localPosition.y-newOrigin.y;var box=def;this.m_vertexCount=4;hX=box.extents.x;hY=box.extents.y;var hcX=Math.max(0.0,hX-2.0*b2Settings.b2_linearSlop);var hcY=Math.max(0.0,hY-2.0*b2Settings.b2_linearSlop);tVec=this.m_vertices[0]=new b2Vec2();tVec.x=localR.col1.x*hX+localR.col2.x*hY;tVec.y=localR.col1.y*hX+localR.col2.y*hY;tVec=this.m_vertices[1]=new b2Vec2();tVec.x=localR.col1.x*-hX+localR.col2.x*hY;tVec.y=localR.col1.y*-hX+localR.col2.y*hY;tVec=this.m_vertices[2]=new b2Vec2();tVec.x=localR.col1.x*-hX+localR.col2.x*-hY;tVec.y=localR.col1.y*-hX+localR.col2.y*-hY;tVec=this.m_vertices[3]=new b2Vec2();tVec.x=localR.col1.x*hX+localR.col2.x*-hY;tVec.y=localR.col1.y*hX+localR.col2.y*-hY;tVec=this.m_coreVertices[0]=new b2Vec2();tVec.x=localR.col1.x*hcX+localR.col2.x*hcY;tVec.y=localR.col1.y*hcX+localR.col2.y*hcY;tVec=this.m_coreVertices[1]=new b2Vec2();tVec.x=localR.col1.x*-hcX+localR.col2.x*hcY;tVec.y=localR.col1.y*-hcX+localR.col2.y*hcY;tVec=this.m_coreVertices[2]=new b2Vec2();tVec.x=localR.col1.x*-hcX+localR.col2.x*-hcY;tVec.y=localR.col1.y*-hcX+localR.col2.y*-hcY;tVec=this.m_coreVertices[3]=new b2Vec2();tVec.x=localR.col1.x*hcX+localR.col2.x*-hcY;tVec.y=localR.col1.y*hcX+localR.col2.y*-hcY;}
else
{var poly=def;this.m_vertexCount=poly.vertexCount;b2Shape.PolyCentroid(poly.vertices,poly.vertexCount,b2PolyShape.tempVec);var centroidX=b2PolyShape.tempVec.x;var centroidY=b2PolyShape.tempVec.y;this.m_localCentroid.x=def.localPosition.x+(localR.col1.x*centroidX+localR.col2.x*centroidY)-newOrigin.x;this.m_localCentroid.y=def.localPosition.y+(localR.col1.y*centroidX+localR.col2.y*centroidY)-newOrigin.y;for(i=0;i<this.m_vertexCount;++i)
{this.m_vertices[i]=new b2Vec2();this.m_coreVertices[i]=new b2Vec2();hX=poly.vertices[i].x-centroidX;hY=poly.vertices[i].y-centroidY;this.m_vertices[i].x=localR.col1.x*hX+localR.col2.x*hY;this.m_vertices[i].y=localR.col1.y*hX+localR.col2.y*hY;var uX=this.m_vertices[i].x;var uY=this.m_vertices[i].y;var length=Math.sqrt(uX*uX+uY*uY);if(length>Number.MIN_VALUE)
{uX*=1.0/length;uY*=1.0/length;}
this.m_coreVertices[i].x=this.m_vertices[i].x-2.0*b2Settings.b2_linearSlop*uX;this.m_coreVertices[i].y=this.m_vertices[i].y-2.0*b2Settings.b2_linearSlop*uY;}}
var minVertexX=Number.MAX_VALUE;var minVertexY=Number.MAX_VALUE;var maxVertexX=-Number.MAX_VALUE;var maxVertexY=-Number.MAX_VALUE;this.m_maxRadius=0.0;for(i=0;i<this.m_vertexCount;++i)
{var v=this.m_vertices[i];minVertexX=Math.min(minVertexX,v.x);minVertexY=Math.min(minVertexY,v.y);maxVertexX=Math.max(maxVertexX,v.x);maxVertexY=Math.max(maxVertexY,v.y);this.m_maxRadius=Math.max(this.m_maxRadius,v.Length());}
this.m_localOBB.R.SetIdentity();this.m_localOBB.center.Set((minVertexX+maxVertexX)*0.5,(minVertexY+maxVertexY)*0.5);this.m_localOBB.extents.Set((maxVertexX-minVertexX)*0.5,(maxVertexY-minVertexY)*0.5);var i1=0;var i2=0;for(i=0;i<this.m_vertexCount;++i)
{this.m_normals[i]=new b2Vec2();i1=i;i2=i+1<this.m_vertexCount?i+1:0;this.m_normals[i].x=this.m_vertices[i2].y-this.m_vertices[i1].y;this.m_normals[i].y=-(this.m_vertices[i2].x-this.m_vertices[i1].x);this.m_normals[i].Normalize();}
for(i=0;i<this.m_vertexCount;++i)
{i1=i;i2=i+1<this.m_vertexCount?i+1:0;}
this.m_R.SetM(this.m_body.m_R);this.m_position.x=this.m_body.m_position.x+(this.m_R.col1.x*this.m_localCentroid.x+this.m_R.col2.x*this.m_localCentroid.y);this.m_position.y=this.m_body.m_position.y+(this.m_R.col1.y*this.m_localCentroid.x+this.m_R.col2.y*this.m_localCentroid.y);b2PolyShape.tAbsR.col1.x=this.m_R.col1.x*this.m_localOBB.R.col1.x+this.m_R.col2.x*this.m_localOBB.R.col1.y;b2PolyShape.tAbsR.col1.y=this.m_R.col1.y*this.m_localOBB.R.col1.x+this.m_R.col2.y*this.m_localOBB.R.col1.y;b2PolyShape.tAbsR.col2.x=this.m_R.col1.x*this.m_localOBB.R.col2.x+this.m_R.col2.x*this.m_localOBB.R.col2.y;b2PolyShape.tAbsR.col2.y=this.m_R.col1.y*this.m_localOBB.R.col2.x+this.m_R.col2.y*this.m_localOBB.R.col2.y;b2PolyShape.tAbsR.Abs()
hX=b2PolyShape.tAbsR.col1.x*this.m_localOBB.extents.x+b2PolyShape.tAbsR.col2.x*this.m_localOBB.extents.y;hY=b2PolyShape.tAbsR.col1.y*this.m_localOBB.extents.x+b2PolyShape.tAbsR.col2.y*this.m_localOBB.extents.y;var positionX=this.m_position.x+(this.m_R.col1.x*this.m_localOBB.center.x+this.m_R.col2.x*this.m_localOBB.center.y);var positionY=this.m_position.y+(this.m_R.col1.y*this.m_localOBB.center.x+this.m_R.col2.y*this.m_localOBB.center.y);aabb.minVertex.x=positionX-hX;aabb.minVertex.y=positionY-hY;aabb.maxVertex.x=positionX+hX;aabb.maxVertex.y=positionY+hY;var broadPhase=this.m_body.m_world.m_broadPhase;if(broadPhase.InRange(aabb))
{this.m_proxyId=broadPhase.CreateProxy(aabb,this);}
else
{this.m_proxyId=b2Pair.b2_nullProxy;}
if(this.m_proxyId==b2Pair.b2_nullProxy)
{this.m_body.Freeze();}},syncAABB:new b2AABB(),syncMat:new b2Mat22(),Synchronize:function(position1,R1,position2,R2){this.m_R.SetM(R2);this.m_position.x=this.m_body.m_position.x+(R2.col1.x*this.m_localCentroid.x+R2.col2.x*this.m_localCentroid.y);this.m_position.y=this.m_body.m_position.y+(R2.col1.y*this.m_localCentroid.x+R2.col2.y*this.m_localCentroid.y);if(this.m_proxyId==b2Pair.b2_nullProxy)
{return;}
var hX;var hY;var v1=R1.col1;var v2=R1.col2;var v3=this.m_localOBB.R.col1;var v4=this.m_localOBB.R.col2;this.syncMat.col1.x=v1.x*v3.x+v2.x*v3.y;this.syncMat.col1.y=v1.y*v3.x+v2.y*v3.y;this.syncMat.col2.x=v1.x*v4.x+v2.x*v4.y;this.syncMat.col2.y=v1.y*v4.x+v2.y*v4.y;this.syncMat.Abs();hX=this.m_localCentroid.x+this.m_localOBB.center.x;hY=this.m_localCentroid.y+this.m_localOBB.center.y;var centerX=position1.x+(R1.col1.x*hX+R1.col2.x*hY);var centerY=position1.y+(R1.col1.y*hX+R1.col2.y*hY);hX=this.syncMat.col1.x*this.m_localOBB.extents.x+this.syncMat.col2.x*this.m_localOBB.extents.y;hY=this.syncMat.col1.y*this.m_localOBB.extents.x+this.syncMat.col2.y*this.m_localOBB.extents.y;this.syncAABB.minVertex.x=centerX-hX;this.syncAABB.minVertex.y=centerY-hY;this.syncAABB.maxVertex.x=centerX+hX;this.syncAABB.maxVertex.y=centerY+hY;v1=R2.col1;v2=R2.col2;v3=this.m_localOBB.R.col1;v4=this.m_localOBB.R.col2;this.syncMat.col1.x=v1.x*v3.x+v2.x*v3.y;this.syncMat.col1.y=v1.y*v3.x+v2.y*v3.y;this.syncMat.col2.x=v1.x*v4.x+v2.x*v4.y;this.syncMat.col2.y=v1.y*v4.x+v2.y*v4.y;this.syncMat.Abs();hX=this.m_localCentroid.x+this.m_localOBB.center.x;hY=this.m_localCentroid.y+this.m_localOBB.center.y;centerX=position2.x+(R2.col1.x*hX+R2.col2.x*hY);centerY=position2.y+(R2.col1.y*hX+R2.col2.y*hY);hX=this.syncMat.col1.x*this.m_localOBB.extents.x+this.syncMat.col2.x*this.m_localOBB.extents.y;hY=this.syncMat.col1.y*this.m_localOBB.extents.x+this.syncMat.col2.y*this.m_localOBB.extents.y;this.syncAABB.minVertex.x=Math.min(this.syncAABB.minVertex.x,centerX-hX);this.syncAABB.minVertex.y=Math.min(this.syncAABB.minVertex.y,centerY-hY);this.syncAABB.maxVertex.x=Math.max(this.syncAABB.maxVertex.x,centerX+hX);this.syncAABB.maxVertex.y=Math.max(this.syncAABB.maxVertex.y,centerY+hY);var broadPhase=this.m_body.m_world.m_broadPhase;if(broadPhase.InRange(this.syncAABB))
{broadPhase.MoveProxy(this.m_proxyId,this.syncAABB);}
else
{this.m_body.Freeze();}},QuickSync:function(position,R){this.m_R.SetM(R);this.m_position.x=position.x+(R.col1.x*this.m_localCentroid.x+R.col2.x*this.m_localCentroid.y);this.m_position.y=position.y+(R.col1.y*this.m_localCentroid.x+R.col2.y*this.m_localCentroid.y);},ResetProxy:function(broadPhase){if(this.m_proxyId==b2Pair.b2_nullProxy)
{return;}
var proxy=broadPhase.GetProxy(this.m_proxyId);broadPhase.DestroyProxy(this.m_proxyId);proxy=null;var R=b2Math.b2MulMM(this.m_R,this.m_localOBB.R);var absR=b2Math.b2AbsM(R);var h=b2Math.b2MulMV(absR,this.m_localOBB.extents);var position=b2Math.b2MulMV(this.m_R,this.m_localOBB.center);position.Add(this.m_position);var aabb=new b2AABB();aabb.minVertex.SetV(position);aabb.minVertex.Subtract(h);aabb.maxVertex.SetV(position);aabb.maxVertex.Add(h);if(broadPhase.InRange(aabb))
{this.m_proxyId=broadPhase.CreateProxy(aabb,this);}
else
{this.m_proxyId=b2Pair.b2_nullProxy;}
if(this.m_proxyId==b2Pair.b2_nullProxy)
{this.m_body.Freeze();}},Support:function(dX,dY,out)
{var dLocalX=(dX*this.m_R.col1.x+dY*this.m_R.col1.y);var dLocalY=(dX*this.m_R.col2.x+dY*this.m_R.col2.y);var bestIndex=0;var bestValue=(this.m_coreVertices[0].x*dLocalX+this.m_coreVertices[0].y*dLocalY);for(var i=1;i<this.m_vertexCount;++i)
{var value=(this.m_coreVertices[i].x*dLocalX+this.m_coreVertices[i].y*dLocalY);if(value>bestValue)
{bestIndex=i;bestValue=value;}}
out.Set(this.m_position.x+(this.m_R.col1.x*this.m_coreVertices[bestIndex].x+this.m_R.col2.x*this.m_coreVertices[bestIndex].y),this.m_position.y+(this.m_R.col1.y*this.m_coreVertices[bestIndex].x+this.m_R.col2.y*this.m_coreVertices[bestIndex].y));},m_localCentroid:new b2Vec2(),m_localOBB:new b2OBB(),m_vertices:null,m_coreVertices:null,m_vertexCount:0,m_normals:null});b2PolyShape.tempVec=new b2Vec2();b2PolyShape.tAbsR=new b2Mat22();
var b2Body=Class.create();b2Body.prototype={SetOriginPosition:function(position,rotation){if(this.IsFrozen())
{return;}
this.m_rotation=rotation;this.m_R.Set(this.m_rotation);this.m_position=b2Math.AddVV(position,b2Math.b2MulMV(this.m_R,this.m_center));this.m_position0.SetV(this.m_position);this.m_rotation0=this.m_rotation;for(var s=this.m_shapeList;s!=null;s=s.m_next)
{s.Synchronize(this.m_position,this.m_R,this.m_position,this.m_R);}
this.m_world.m_broadPhase.Commit();},GetOriginPosition:function(){return b2Math.SubtractVV(this.m_position,b2Math.b2MulMV(this.m_R,this.m_center));},SetCenterPosition:function(position,rotation){if(this.IsFrozen())
{return;}
this.m_rotation=rotation;this.m_R.Set(this.m_rotation);this.m_position.SetV(position);this.m_position0.SetV(this.m_position);this.m_rotation0=this.m_rotation;for(var s=this.m_shapeList;s!=null;s=s.m_next)
{s.Synchronize(this.m_position,this.m_R,this.m_position,this.m_R);}
this.m_world.m_broadPhase.Commit();},GetCenterPosition:function(){return this.m_position;},GetRotation:function(){return this.m_rotation;},GetRotationMatrix:function(){return this.m_R;},SetLinearVelocity:function(v){this.m_linearVelocity.SetV(v);},GetLinearVelocity:function(){return this.m_linearVelocity;},SetAngularVelocity:function(w){this.m_angularVelocity=w;},GetAngularVelocity:function(){return this.m_angularVelocity;},ApplyForce:function(force,point)
{if(this.IsSleeping()==false)
{this.m_force.Add(force);this.m_torque+=b2Math.b2CrossVV(b2Math.SubtractVV(point,this.m_position),force);}},ApplyTorque:function(torque)
{if(this.IsSleeping()==false)
{this.m_torque+=torque;}},ApplyImpulse:function(impulse,point)
{if(this.IsSleeping()==false)
{this.m_linearVelocity.Add(b2Math.MulFV(this.m_invMass,impulse));this.m_angularVelocity+=(this.m_invI*b2Math.b2CrossVV(b2Math.SubtractVV(point,this.m_position),impulse));}},GetMass:function(){return this.m_mass;},GetInertia:function(){return this.m_I;},GetWorldPoint:function(localPoint){return b2Math.AddVV(this.m_position,b2Math.b2MulMV(this.m_R,localPoint));},GetWorldVector:function(localVector){return b2Math.b2MulMV(this.m_R,localVector);},GetLocalPoint:function(worldPoint){return b2Math.b2MulTMV(this.m_R,b2Math.SubtractVV(worldPoint,this.m_position));},GetLocalVector:function(worldVector){return b2Math.b2MulTMV(this.m_R,worldVector);},IsStatic:function(){return(this.m_flags&b2Body.e_staticFlag)==b2Body.e_staticFlag;},IsFrozen:function()
{return(this.m_flags&b2Body.e_frozenFlag)==b2Body.e_frozenFlag;},IsSleeping:function(){return(this.m_flags&b2Body.e_sleepFlag)==b2Body.e_sleepFlag;},AllowSleeping:function(flag)
{if(flag)
{this.m_flags|=b2Body.e_allowSleepFlag;}
else
{this.m_flags&=~b2Body.e_allowSleepFlag;this.WakeUp();}},WakeUp:function(){this.m_flags&=~b2Body.e_sleepFlag;this.m_sleepTime=0.0;},GetShapeList:function(){return this.m_shapeList;},GetContactList:function()
{return this.m_contactList;},GetJointList:function()
{return this.m_jointList;},GetNext:function(){return this.m_next;},GetUserData:function(){return this.m_userData;},initialize:function(bd,world){this.sMat0=new b2Mat22();this.m_position=new b2Vec2();this.m_R=new b2Mat22(0);this.m_position0=new b2Vec2();var i=0;var sd;var massData;this.m_flags=0;this.m_position.SetV(bd.position);this.m_rotation=bd.rotation;this.m_R.Set(this.m_rotation);this.m_position0.SetV(this.m_position);this.m_rotation0=this.m_rotation;this.m_world=world;this.m_linearDamping=b2Math.b2Clamp(1.0-bd.linearDamping,0.0,1.0);this.m_angularDamping=b2Math.b2Clamp(1.0-bd.angularDamping,0.0,1.0);this.m_force=new b2Vec2(0.0,0.0);this.m_torque=0.0;this.m_mass=0.0;var massDatas=new Array(b2Settings.b2_maxShapesPerBody);for(i=0;i<b2Settings.b2_maxShapesPerBody;i++){massDatas[i]=new b2MassData();}
this.m_shapeCount=0;this.m_center=new b2Vec2(0.0,0.0);for(i=0;i<b2Settings.b2_maxShapesPerBody;++i)
{sd=bd.shapes[i];if(sd==null)break;massData=massDatas[i];sd.ComputeMass(massData);this.m_mass+=massData.mass;this.m_center.x+=massData.mass*(sd.localPosition.x+massData.center.x);this.m_center.y+=massData.mass*(sd.localPosition.y+massData.center.y);++this.m_shapeCount;}
if(this.m_mass>0.0)
{this.m_center.Multiply(1.0/this.m_mass);this.m_position.Add(b2Math.b2MulMV(this.m_R,this.m_center));}
else
{this.m_flags|=b2Body.e_staticFlag;}
this.m_I=0.0;for(i=0;i<this.m_shapeCount;++i)
{sd=bd.shapes[i];massData=massDatas[i];this.m_I+=massData.I;var r=b2Math.SubtractVV(b2Math.AddVV(sd.localPosition,massData.center),this.m_center);this.m_I+=massData.mass*b2Math.b2Dot(r,r);}
if(this.m_mass>0.0)
{this.m_invMass=1.0/this.m_mass;}
else
{this.m_invMass=0.0;}
if(this.m_I>0.0&&bd.preventRotation==false)
{this.m_invI=1.0/this.m_I;}
else
{this.m_I=0.0;this.m_invI=0.0;}
this.m_linearVelocity=b2Math.AddVV(bd.linearVelocity,b2Math.b2CrossFV(bd.angularVelocity,this.m_center));this.m_angularVelocity=bd.angularVelocity;this.m_jointList=null;this.m_contactList=null;this.m_prev=null;this.m_next=null;this.m_shapeList=null;for(i=0;i<this.m_shapeCount;++i)
{sd=bd.shapes[i];var shape=b2Shape.Create(sd,this,this.m_center);shape.m_next=this.m_shapeList;this.m_shapeList=shape;}
this.m_sleepTime=0.0;if(bd.allowSleep)
{this.m_flags|=b2Body.e_allowSleepFlag;}
if(bd.isSleeping)
{this.m_flags|=b2Body.e_sleepFlag;}
if((this.m_flags&b2Body.e_sleepFlag)||this.m_invMass==0.0)
{this.m_linearVelocity.Set(0.0,0.0);this.m_angularVelocity=0.0;}
this.m_userData=bd.userData;},Destroy:function(){var s=this.m_shapeList;while(s)
{var s0=s;s=s.m_next;b2Shape.Destroy(s0);}},sMat0:new b2Mat22(),SynchronizeShapes:function(){this.sMat0.Set(this.m_rotation0);for(var s=this.m_shapeList;s!=null;s=s.m_next)
{s.Synchronize(this.m_position0,this.sMat0,this.m_position,this.m_R);}},QuickSyncShapes:function(){for(var s=this.m_shapeList;s!=null;s=s.m_next)
{s.QuickSync(this.m_position,this.m_R);}},IsConnected:function(other){for(var jn=this.m_jointList;jn!=null;jn=jn.next)
{if(jn.other==other)
return jn.joint.m_collideConnected==false;}
return false;},Freeze:function(){this.m_flags|=b2Body.e_frozenFlag;this.m_linearVelocity.SetZero();this.m_angularVelocity=0.0;for(var s=this.m_shapeList;s!=null;s=s.m_next)
{s.DestroyProxy();}},m_flags:0,m_position:new b2Vec2(),m_rotation:null,m_R:new b2Mat22(0),m_position0:new b2Vec2(),m_rotation0:null,m_linearVelocity:null,m_angularVelocity:null,m_force:null,m_torque:null,m_center:null,m_world:null,m_prev:null,m_next:null,m_shapeList:null,m_shapeCount:0,m_jointList:null,m_contactList:null,m_mass:null,m_invMass:null,m_I:null,m_invI:null,m_linearDamping:null,m_angularDamping:null,m_sleepTime:null,m_userData:null};b2Body.e_staticFlag=0x0001;b2Body.e_frozenFlag=0x0002;b2Body.e_islandFlag=0x0004;b2Body.e_sleepFlag=0x0008;b2Body.e_allowSleepFlag=0x0010;b2Body.e_destroyFlag=0x0020;
var b2BodyDef=Class.create();b2BodyDef.prototype={initialize:function()
{this.shapes=new Array();this.userData=null;for(var i=0;i<b2Settings.b2_maxShapesPerBody;i++){this.shapes[i]=null;}
this.position=new b2Vec2(0.0,0.0);this.rotation=0.0;this.linearVelocity=new b2Vec2(0.0,0.0);this.angularVelocity=0.0;this.linearDamping=0.0;this.angularDamping=0.0;this.allowSleep=true;this.isSleeping=false;this.preventRotation=false;},userData:null,shapes:new Array(),position:null,rotation:null,linearVelocity:null,angularVelocity:null,linearDamping:null,angularDamping:null,allowSleep:null,isSleeping:null,preventRotation:null,AddShape:function(shape)
{for(var i=0;i<b2Settings.b2_maxShapesPerBody;++i)
{if(this.shapes[i]==null)
{this.shapes[i]=shape;break;}}}};
var b2CollisionFilter=Class.create();b2CollisionFilter.prototype={ShouldCollide:function(shape1,shape2){if(shape1.m_groupIndex==shape2.m_groupIndex&&shape1.m_groupIndex!=0)
{return shape1.m_groupIndex>0;}
var collide=(shape1.m_maskBits&shape2.m_categoryBits)!=0&&(shape1.m_categoryBits&shape2.m_maskBits)!=0;return collide;},initialize:function(){}};b2CollisionFilter.b2_defaultFilter=new b2CollisionFilter;
var b2Island=Class.create();b2Island.prototype={initialize:function(bodyCapacity,contactCapacity,jointCapacity,allocator)
{var i=0;this.m_bodyCapacity=bodyCapacity;this.m_contactCapacity=contactCapacity;this.m_jointCapacity=jointCapacity;this.m_bodyCount=0;this.m_contactCount=0;this.m_jointCount=0;this.m_bodies=new Array(bodyCapacity);for(i=0;i<bodyCapacity;i++)
this.m_bodies[i]=null;this.m_contacts=new Array(contactCapacity);for(i=0;i<contactCapacity;i++)
this.m_contacts[i]=null;this.m_joints=new Array(jointCapacity);for(i=0;i<jointCapacity;i++)
this.m_joints[i]=null;this.m_allocator=allocator;},Clear:function()
{this.m_bodyCount=0;this.m_contactCount=0;this.m_jointCount=0;},Solve:function(step,gravity)
{var i=0;var b;for(i=0;i<this.m_bodyCount;++i)
{b=this.m_bodies[i];if(b.m_invMass==0.0)
continue;b.m_linearVelocity.Add(b2Math.MulFV(step.dt,b2Math.AddVV(gravity,b2Math.MulFV(b.m_invMass,b.m_force))));b.m_angularVelocity+=step.dt*b.m_invI*b.m_torque;b.m_linearVelocity.Multiply(b.m_linearDamping);b.m_angularVelocity*=b.m_angularDamping;b.m_position0.SetV(b.m_position);b.m_rotation0=b.m_rotation;}
var contactSolver=new b2ContactSolver(this.m_contacts,this.m_contactCount,this.m_allocator);contactSolver.PreSolve();for(i=0;i<this.m_jointCount;++i)
{this.m_joints[i].PrepareVelocitySolver();}
for(i=0;i<step.iterations;++i)
{contactSolver.SolveVelocityConstraints();for(var j=0;j<this.m_jointCount;++j)
{this.m_joints[j].SolveVelocityConstraints(step);}}
for(i=0;i<this.m_bodyCount;++i)
{b=this.m_bodies[i];if(b.m_invMass==0.0)
continue;b.m_position.x+=step.dt*b.m_linearVelocity.x;b.m_position.y+=step.dt*b.m_linearVelocity.y;b.m_rotation+=step.dt*b.m_angularVelocity;b.m_R.Set(b.m_rotation);}
for(i=0;i<this.m_jointCount;++i)
{this.m_joints[i].PreparePositionSolver();}
if(b2World.s_enablePositionCorrection)
{for(b2Island.m_positionIterationCount=0;b2Island.m_positionIterationCount<step.iterations;++b2Island.m_positionIterationCount)
{var contactsOkay=contactSolver.SolvePositionConstraints(b2Settings.b2_contactBaumgarte);var jointsOkay=true;for(i=0;i<this.m_jointCount;++i)
{var jointOkay=this.m_joints[i].SolvePositionConstraints();jointsOkay=jointsOkay&&jointOkay;}
if(contactsOkay&&jointsOkay)
{break;}}}
contactSolver.PostSolve();for(i=0;i<this.m_bodyCount;++i)
{b=this.m_bodies[i];if(b.m_invMass==0.0)
continue;b.m_R.Set(b.m_rotation);b.SynchronizeShapes();b.m_force.Set(0.0,0.0);b.m_torque=0.0;}},UpdateSleep:function(dt)
{var i=0;var b;var minSleepTime=Number.MAX_VALUE;var linTolSqr=b2Settings.b2_linearSleepTolerance*b2Settings.b2_linearSleepTolerance;var angTolSqr=b2Settings.b2_angularSleepTolerance*b2Settings.b2_angularSleepToler